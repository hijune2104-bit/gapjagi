"use client";

// 회의 응답 + 공유 허브 (M-03·M-07) — 링크로 들어와 가능 시간 칠하기 + 실시간 응답 현황.
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import { PaintGrid } from "@/features/meeting/MeetingGrid";
import { DEFAULT_MEETING_CONFIG } from "@/features/meeting/constants";
import type { EventRow, MeetingConfig, MeetingResponder, Participant } from "@/lib/types";

export default function MeetingRespondPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [responders, setResponders] = useState<MeetingResponder[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [voterName, setVoterName] = useState("");
  const [myPaint, setMyPaint] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const initedMine = useRef(false);

  useEffect(() => {
    if (user?.name) setVoterName(user.name);
  }, [user]);

  // 최초 로드 + 2초 폴링 (응답 현황 실시간)
  useEffect(() => {
    let alive = true;
    async function load(first: boolean) {
      try {
        const r = await fetch(`/api/meetings/${eventId}`);
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!alive) return;
        setEvent(d.event);
        setResponders(d.responders ?? []);
        setParticipants(d.participants ?? []);
      } catch {
        if (first && alive) setNotFound(true);
      } finally {
        if (first && alive) setLoading(false);
      }
    }
    load(true);
    const t = setInterval(() => load(false), 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [eventId]);

  const myName = (user?.name ?? voterName).trim();
  const mine = responders.find((r) => r.voter_name === myName);
  const submitted = Boolean(mine);

  // 내 기존 응답을 그리드에 1회 프리필 (편집 중 덮어쓰기 방지)
  useEffect(() => {
    if (mine && !initedMine.current) {
      setMyPaint(mine.slots);
      initedMine.current = true;
    }
  }, [mine]);

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/m/${eventId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function submit() {
    if (!myName || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/meetings/${eventId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterName: myName,
          account: user?.account ?? null,
          slots: myPaint,
        }),
      });
      if (!res.ok) throw new Error();
      // 즉시 반영 (폴링 기다리지 않고)
      setResponders((prev) => {
        const others = prev.filter((r) => r.voter_name !== myName);
        return [...others, { voter_name: myName, account: user?.account ?? null, slots: myPaint }];
      });
    } finally {
      setSubmitting(false);
    }
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

  const config = (event.config as unknown as MeetingConfig) ?? DEFAULT_MEETING_CONFIG;
  const total = Math.max(participants.length, responders.length);
  const otherNames = responders.filter((r) => r.voter_name !== myName).map((r) => r.voter_name);

  return (
    <Shell
      steps={["선택", "의논", "완성"]}
      activeStep={1}
      cta={
        <>
          <button
            className="cta mint"
            style={{ marginBottom: 8 }}
            onClick={submit}
            disabled={!myName || submitting}
          >
            {submitting ? "제출 중…" : submitted ? "가능 시간 수정" : "가능 시간 제출"}
          </button>
          <button
            className="cta ghost"
            onClick={() => router.push(`/m/${eventId}/result`)}
            disabled={responders.length === 0}
          >
            결과 취합 보기 →
          </button>
        </>
      }
    >
      {/* 카톡에서 열린 느낌의 헤더 */}
      <div className="guesthead" style={{ background: "#DCE6FF" }}>
        <div className="gh-from">
          <span className="gh-av" style={{ background: "#25366F", color: "#DCE6FF" }}>
            📅
          </span>
          회의 가능 시간을 알려주세요
        </div>
        <div className="gh-title" style={{ color: "#1A1A1E" }}>
          {event.title}
        </div>
        <div className="gh-meta" style={{ color: "#4A5A85" }}>
          가능한 시간만 탭하면 끝이에요
        </div>
      </div>

      {/* 공유 링크 */}
      <div className="linkbox">
        <span className="u">🔗 이 링크를 단톡방에 공유하세요</span>
        <button onClick={copyLink}>{copied ? "복사됨!" : "복사"}</button>
      </div>

      {/* 실시간 응답 현황 */}
      <div className="livebar" style={{ marginTop: 14 }}>
        <span className="live">
          <span className="d" />
          실시간
        </span>
        <span>
          응답 {responders.length}
          {total ? `/${total}` : ""}명
        </span>
        <span style={{ marginLeft: "auto" }}>
          {otherNames.length ? `${otherNames.join(", ")}님 응답함` : "아직 응답 없음"}
        </span>
      </div>

      {submitted && (
        <div className="votedbanner" style={{ marginTop: 12 }}>
          ✅ 제출 완료! 아래에서 수정하거나 결과를 확인하세요.
        </div>
      )}

      {/* 참여자 */}
      {participants.length > 0 && (
        <div className="field" style={{ marginTop: 16 }}>
          <label>참여자 {participants.length}명</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {participants.map((p) => (
              <span key={p.account} className="attn" style={{ margin: 0 }}>
                <span className="p">
                  <Avatar name={p.name} photo={p.photo} size={20} />
                  {p.name}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 내 가능 시간 그리드 */}
      <div className="field">
        <label>
          {user ? `${user.name}님 가능 시간` : "내 가능 시간"} — 탭 또는 드래그
        </label>
        {!user && (
          <input
            className="tinput"
            style={{ marginBottom: 10 }}
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        )}
        <PaintGrid config={config} value={myPaint} onChange={setMyPaint} />
      </div>
    </Shell>
  );
}
