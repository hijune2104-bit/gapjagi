"use client";

// 회의 결과 취합 (M-08·M-09·M-10) — 히트맵 + 최적 시간 + 원탭 갈등해결 → 확정.
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import { HeatGrid } from "@/features/meeting/MeetingGrid";
import { analyzeMeeting, slotLabel } from "@/features/meeting/grid";
import { DEFAULT_MEETING_CONFIG, RESPONDER_COLORS } from "@/features/meeting/constants";
import type { EventRow, MeetingConfig, MeetingResponder } from "@/lib/types";

export default function MeetingResultPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [responders, setResponders] = useState<MeetingResponder[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    async function load(first: boolean) {
      try {
        const r = await fetch(`/api/meetings/${eventId}`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!alive.current) return;
        setEvent(d.event);
        setResponders(d.responders ?? []);
      } catch {
        if (first && alive.current) setNotFound(true);
      } finally {
        if (first && alive.current) setLoading(false);
      }
    }
    load(true);
    const t = setInterval(() => load(false), 2000);
    return () => {
      alive.current = false;
      clearInterval(t);
    };
  }, [eventId]);

  const config = (event?.config as unknown as MeetingConfig) ?? DEFAULT_MEETING_CONFIG;

  // 이름 → 색상 (전체 응답자 기준으로 안정적으로 부여)
  const colorOf = useMemo(() => {
    const m = new Map<string, string>();
    responders.forEach((r, i) => m.set(r.voter_name, RESPONDER_COLORS[i % RESPONDER_COLORS.length]));
    return m;
  }, [responders]);

  const filtered = responders.filter((r) => !excluded.includes(r.voter_name));
  const analysis = analyzeMeeting(config, filtered, user?.name);

  async function confirm(slot: string, count: number, excludedList: string[]) {
    if (!slot || confirming) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/meetings/${eventId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot,
          attendeeCount: count,
          totalCount: responders.length,
          excluded: excludedList,
        }),
      });
      if (!res.ok) throw new Error();
      router.push(`/m/${eventId}/confirm`);
    } catch {
      setConfirming(false);
    }
  }

  // blocker 를 빼고 재계산한 최적 시간으로 바로 확정
  function excludeAndConfirm(name: string) {
    const nextExcluded = [...excluded, name];
    const f2 = responders.filter((r) => !nextExcluded.includes(r.voter_name));
    const a2 = analyzeMeeting(config, f2, user?.name);
    confirm(a2.best, a2.bestCount, nextExcluded);
  }

  function findAllAndConfirm() {
    if (analysis.allSlot) confirm(analysis.allSlot, filtered.length, excluded);
    else alert("전원 되는 시간이 없어요 — 불참자 개별 조율이 필요해요.");
  }

  if (loading)
    return (
      <Shell>
        <p className="helper" style={{ marginTop: 40, textAlign: "center" }}>
          불러오는 중…
        </p>
      </Shell>
    );
  if (notFound || !event)
    return (
      <Shell>
        <p className="helper" style={{ marginTop: 40, textAlign: "center" }}>
          존재하지 않는 회의에요 😢
        </p>
      </Shell>
    );

  if (responders.length === 0)
    return (
      <Shell steps={["선택", "의논", "완성"]} activeStep={1}>
        <h1 className="title" style={{ fontSize: 22 }}>
          아직 응답이 없어요
        </h1>
        <p className="helper">팀원이 가능 시간을 칠하면 여기 최적 시간이 뜹니다.</p>
        <button
          className="cta ghost"
          style={{ marginTop: 20 }}
          onClick={() => router.push(`/m/${eventId}`)}
        >
          ← 응답 화면으로
        </button>
      </Shell>
    );

  const { best, bestCount, total, scores, maxScore, blocker } = analysis;
  const weekLabel = config.weekLabel ?? "다음 주";

  return (
    <Shell
      steps={["선택", "의논", "완성"]}
      activeStep={2}
      cta={
        <button
          className="cta mint"
          onClick={() => confirm(best, bestCount, excluded)}
          disabled={confirming || !best}
        >
          {confirming ? "확정 중…" : "이 시간으로 확정하기"}
        </button>
      }
    >
      <div className="best">
        <h3>👍 가장 많이 겹치는 시간</h3>
        <div className="big">{slotLabel(best, weekLabel)}</div>
        <div className="who">
          참석 가능 {bestCount}/{total}명
        </div>
        <div className="attn">
          {filtered.map((r) => {
            const ok = r.slots.includes(best);
            return (
              <span key={r.voter_name} className={`p ${ok ? "" : "out"}`}>
                <i style={{ background: colorOf.get(r.voter_name) }}>{r.voter_name[0]}</i>
                {r.voter_name}
              </span>
            );
          })}
        </div>
      </div>

      {/* 원탭 갈등 해결 */}
      {blocker ? (
        <div className="conflict">
          <h3>⚠️ 여기서 주최자 공수가 터져요</h3>
          <p>
            {blocker.voter_name}님이 가능성 높은 상위 시간대에 계속 안 돼요. 이럴 때 한 명 붙잡고
            조율하면 하루가 갑니다.
          </p>
          <span className="blk">
            <i style={{ background: colorOf.get(blocker.voter_name) }}>
              {blocker.voter_name[0]}
            </i>
            {blocker.voter_name}님 · 상위 3개 시간 모두 불참
          </span>
          <div className="optrow">
            <button
              className="optbtn solid"
              onClick={() => excludeAndConfirm(blocker.voter_name)}
              disabled={confirming}
            >
              {blocker.voter_name}님 빼고
              <br />
              {filtered.length - 1}명으로 확정
            </button>
            <button className="optbtn" onClick={findAllAndConfirm} disabled={confirming}>
              전원 되는
              <br />
              시간 찾기
            </button>
          </div>
        </div>
      ) : (
        bestCount === total &&
        total > 0 && (
          <div
            className="conflict"
            style={{ background: "var(--mint-bg)", borderColor: "#BCEBD8" }}
          >
            <h3 style={{ color: "var(--mint-d)" }}>🎉 전원 가능한 시간이에요</h3>
            <p style={{ color: "var(--mint-d)" }}>
              {total}명 모두 되는 시간을 찾았어요. 바로 확정하세요.
            </p>
          </div>
        )
      )}

      <p className="helper">
        색이 진할수록 많은 사람이 가능해요.
        {excluded.length ? ` (${excluded.join(", ")} 제외됨)` : ""}
      </p>
      <HeatGrid config={config} scores={scores} maxScore={maxScore} bestKey={best} />
    </Shell>
  );
}
