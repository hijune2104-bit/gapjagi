"use client";

// 1차 투표지 (D-07) — 링크로 들어와 후보에 투표. 로그인 이름 자동, 게스트는 닉네임.
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import StaticMap from "@/components/StaticMap";
import Avatar from "@/components/Avatar";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import type {
  CandidateRow,
  DinnerConfig,
  EventRow,
  Participant,
} from "@/lib/types";

export default function VotePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [voterName, setVoterName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (user?.name) setVoterName(user.name);
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem("gapjagi:voterName");
    if (saved) setVoterName(saved);
    fetch(`/api/events/${eventId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setEvent(data.event);
        setCandidates(data.candidates);
        setParticipants(data.participants ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/e/${eventId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function joinEvent() {
    if (!user?.account) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/events/${eventId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: user.account, name: user.name, photo: user.photo }),
      });
      if (res.ok)
        setParticipants((prev) =>
          prev.some((p) => p.account === user.account)
            ? prev
            : [...prev, { account: user.account, name: user.name, photo: user.photo ?? null }]
        );
    } finally {
      setJoining(false);
    }
  }

  async function vote() {
    if (!selected || !voterName.trim()) return;
    setSubmitting(true);
    localStorage.setItem("gapjagi:voterName", voterName.trim());
    try {
      const res = await fetch(`/api/events/${eventId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selected, voterName: voterName.trim() }),
      });
      if (!res.ok) throw new Error();
      router.push(`/e/${eventId}/result`);
    } catch {
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
          존재하지 않는 투표에요 😢
        </p>
      </Shell>
    );

  const config = event.config as DinnerConfig;
  const meta = (config.moods ?? []).join(" · ");
  const joined = user && participants.some((p) => p.account === user.account);

  // 회식 일시를 "7월 10일(목) 오후 7시" 형태로 — OG 미리보기 카드용
  function prettyDate(s?: string): string | null {
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const h = d.getHours();
    const ampm = h < 12 ? "오전" : "오후";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const min = d.getMinutes();
    return `${d.getMonth() + 1}월 ${d.getDate()}일(${days[d.getDay()]}) ${ampm} ${h12}시${min ? ` ${min}분` : ""}`;
  }
  const whenText = prettyDate(config.scheduledAt);
  // OG 카드에 보여줄 대표 이모지 — 분위기 태그에서 유추, 없으면 회식 기본
  const ogEmoji = (config.moods ?? []).some((m) => m.includes("고기"))
    ? "🍖"
    : (config.moods ?? []).some((m) => m.includes("술") || m.includes("호프") || m.includes("포차"))
      ? "🍻"
      : "🍽️";

  return (
    <Shell
      steps={["선택", "의논", "완성"]}
      activeStep={1}
      cta={
        <button
          className="cta"
          onClick={vote}
          disabled={!selected || !voterName.trim() || submitting}
        >
          {submitting ? "투표 중…" : "투표하고 결과 보기"}
        </button>
      }
    >
      {/* 카톡에서 열린 느낌의 헤더 */}
      <div className="guesthead">
        <div className="gh-from">
          <span className="gh-av">🍻</span> 갑자기 회식 투표
        </div>
        <div className="gh-title">{event.title}</div>
        <div className="gh-meta">
          {config.headcount}명 · {config.budget}
          {meta ? ` · ${meta}` : ""}
        </div>
      </div>

      {/* OG 미리보기 — 단톡방에 링크를 붙였을 때 뜨는 카드 (D-06) */}
      <p className="helper" style={{ margin: "16px 0 6px" }}>
        단톡방에 이렇게 뜹니다
      </p>
      <div className="og">
        <div className="img">
          {ogEmoji}
          <div className="tag">🍻 갑자기 회식</div>
        </div>
        <div className="meta">
          <h4>{event.title}</h4>
          <p>
            {[whenText, `${config.headcount}명`, `추천 ${candidates.length}곳`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="url">gapjagi.app/e/{eventId.slice(0, 8)}</div>
        </div>
      </div>

      {/* 공유 링크 */}
      <div className="linkbox">
        <span className="u">🔗 이 링크를 단톡방에 공유하세요</span>
        <button onClick={copyLink}>{copied ? "복사됨!" : "복사"}</button>
      </div>

      {/* 참여자 */}
      <div className="field" style={{ marginTop: 18 }}>
        <label>
          참여자 {participants.length}명
          {user && !joined && (
            <button
              onClick={joinEvent}
              disabled={joining}
              style={{
                float: "right",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                background: "var(--coral)",
                border: "none",
                borderRadius: 20,
                padding: "4px 11px",
                cursor: "pointer",
              }}
            >
              {joining ? "참여 중…" : "+ 나도 참여"}
            </button>
          )}
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {participants.map((p) => (
            <span
              key={p.account}
              className="attn"
              style={{ margin: 0 }}
            >
              <span className="p">
                <Avatar name={p.name} photo={p.photo} size={20} />
                {p.name}
              </span>
            </span>
          ))}
          {participants.length === 0 && (
            <span className="helper" style={{ margin: 0 }}>
              아직 없어요
            </span>
          )}
        </div>
      </div>

      {/* 후보 */}
      <div className="field">
        <label>어디로 갈까요?</label>
        {candidates.map((c) => {
          const on = selected === c.id;
          const tags = c.meta?.tags ?? [];
          return (
            <div
              key={c.id}
              className={`cand${on ? " picked" : ""}`}
              onClick={() => setSelected(c.id)}
            >
              <div className="row1">
                <div className={`selbox${on ? " on" : ""}`}>{on ? "✓" : ""}</div>
                {c.meta?.lat && c.meta?.lng ? (
                  <StaticMap
                    lat={c.meta.lat}
                    lng={c.meta.lng}
                    size={46}
                    className="rounded-[11px] shrink-0"
                  />
                ) : (
                  <div className="ph">🍽️</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4>{c.name}</h4>
                  <div className="info">
                    {c.meta?.category && <span>{c.meta.category}</span>}
                    {c.meta?.address && <span>{c.meta.address}</span>}
                  </div>
                </div>
              </div>
              {tags.length > 0 && (
                <div style={{ marginTop: 9, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tags.map((t) => (
                    <span key={t} className="notetag" style={{ margin: 0, padding: "5px 10px" }}>
                      💬 {t}
                    </span>
                  ))}
                </div>
              )}
              {c.meta?.placeUrl && (
                <a
                  href={c.meta.placeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "var(--coral-d)", display: "inline-block", marginTop: 9 }}
                >
                  🗺 지도·리뷰 ›
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* 이름 */}
      <div className="field">
        <label>내 이름</label>
        {user ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--soft)",
              borderRadius: 12,
              padding: "11px 14px",
            }}
          >
            <Avatar name={user.name} photo={user.photo} size={30} />
            <b>{user.name}</b>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
              로그인됨
            </span>
          </div>
        ) : (
          <input
            className="tinput"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="예: 윤슬기"
          />
        )}
      </div>
    </Shell>
  );
}
