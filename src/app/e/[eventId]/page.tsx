"use client";

// 1차: 투표지 — 팀원이 공유 링크로 들어와 이름 넣고 후보에 투표.
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, StepBar } from "@/components/ui";
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

  const [event, setEvent] = useState<EventRow | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [voterName, setVoterName] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { user } = useCurrentUser();

  // 로그인 사용자가 있으면 이름을 자동으로 채움 (프로필 사진과 함께 표시).
  useEffect(() => {
    if (user?.name) setVoterName(user.name);
  }, [user]);

  useEffect(() => {
    // 로그인 안 했을 때: 이전에 입력한 이름 기억 (재투표 편의)
    const saved = localStorage.getItem("gapjagi:voterName");
    if (saved) setVoterName(saved);

    fetch(`/api/events/${eventId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
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

  // 링크로 들어온 로그인 사용자를 참여자로 합류시킴.
  async function joinEvent() {
    if (!user?.account) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/events/${eventId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: user.account,
          name: user.name,
          photo: user.photo,
        }),
      });
      if (res.ok) {
        setParticipants((prev) =>
          prev.some((p) => p.account === user.account)
            ? prev
            : [...prev, { account: user.account, name: user.name, photo: user.photo ?? null }]
        );
      }
    } finally {
      setJoining(false);
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/e/${eventId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleVote() {
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

  if (loading) {
    return <CenterMsg>불러오는 중…</CenterMsg>;
  }
  if (notFound || !event) {
    return <CenterMsg>존재하지 않는 투표에요 😢</CenterMsg>;
  }

  const config = event.config as DinnerConfig;

  return (
    <main className="screen px-5 pb-28">
      <StepBar step={1} />

      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">🍻 {event.title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {config.headcount ? <Tag>{config.headcount}명</Tag> : null}
          {config.budget ? <Tag>{config.budget}</Tag> : null}
          {(config.moods ?? []).map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>
        {config.memo ? (
          <p className="mt-3 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-800">
            “{config.memo}”
          </p>
        ) : null}
      </header>

      {/* 공유 링크 */}
      <button
        onClick={copyLink}
        className="mt-4 flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-stone-200 active:scale-[0.99]"
      >
        <span className="text-stone-500">
          🔗 단톡방에 이 링크 공유하고 투표받기
        </span>
        <span className="font-semibold text-orange-500">
          {copied ? "복사됨!" : "복사"}
        </span>
      </button>

      {/* 참여자 */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-sm font-semibold text-stone-600">
            참여자 {participants.length}명
          </span>
          {user && !participants.some((p) => p.account === user.account) && (
            <button
              onClick={joinEvent}
              disabled={joining}
              className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white active:scale-95 disabled:opacity-50"
            >
              {joining ? "참여 중…" : "+ 나도 참여"}
            </button>
          )}
        </div>
        {participants.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => (
              <span
                key={p.account}
                className="flex items-center gap-1.5 rounded-full bg-white py-0.5 pl-0.5 pr-2.5 text-xs text-stone-600 ring-1 ring-stone-200"
              >
                <Avatar name={p.name} photo={p.photo} size={20} />
                {p.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="px-1 text-xs text-stone-400">
            아직 참여자가 없어요. 로그인하면 참여할 수 있어요.
          </p>
        )}
      </div>

      {/* 이름 */}
      <div className="mt-6">
        <label className="mb-2 block px-1 text-sm font-semibold text-stone-600">
          내 이름
        </label>
        {user ? (
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-stone-200">
            <Avatar name={user.name} photo={user.photo} size={32} />
            <span className="text-[15px] font-semibold text-stone-800">
              {user.name}
            </span>
            <span className="ml-auto text-xs text-stone-400">로그인됨</span>
          </div>
        ) : (
          <input
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
            placeholder="예: 윤슬기"
            className="w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-stone-200 outline-none focus:ring-orange-400"
          />
        )}
      </div>

      {/* 후보 목록 */}
      <div className="mt-6">
        <label className="mb-2 block px-1 text-sm font-semibold text-stone-600">
          어디로 갈까요?
        </label>
        <div className="flex flex-col gap-2.5">
          {candidates.map((c) => {
            const active = selected === c.id;
            return (
              <div
                key={c.id}
                className={`rounded-2xl p-4 transition ${
                  active
                    ? "bg-orange-50 ring-2 ring-orange-400"
                    : "bg-white ring-1 ring-stone-200"
                }`}
              >
                <button
                  onClick={() => setSelected(c.id)}
                  className="flex w-full items-center gap-3 text-left active:scale-[0.99]"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      active
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-stone-300"
                    }`}
                  >
                    {active ? "✓" : ""}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800">{c.name}</span>
                      {c.meta?.category ? (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">
                          {c.meta.category}
                        </span>
                      ) : null}
                    </div>
                    {c.meta?.address ? (
                      <div className="mt-0.5 text-[13px] text-stone-500">
                        📍 {c.meta.address}
                      </div>
                    ) : c.meta?.note ? (
                      <div className="mt-0.5 text-[13px] text-stone-500">
                        {c.meta.note}
                      </div>
                    ) : null}
                  </div>
                </button>
                {c.meta?.placeUrl ? (
                  <a
                    href={c.meta.placeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 ml-9 inline-block text-[13px] font-medium text-orange-600 underline"
                  >
                    ⭐ 카카오맵 리뷰 보기 ›
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-stone-200/70 bg-background/95 p-4 backdrop-blur">
        <Button
          onClick={handleVote}
          disabled={!selected || !voterName.trim() || submitting}
        >
          {submitting ? "투표 중…" : "투표하고 결과 보기"}
        </Button>
      </div>
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-500">
      {children}
    </span>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <main className="screen items-center justify-center px-5 text-stone-500">
      <div className="flex flex-1 items-center justify-center text-center">
        {children}
      </div>
    </main>
  );
}
