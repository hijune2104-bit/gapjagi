"use client";

// 2차: 결과 — 폴링(2초)으로 득표 집계를 갱신. 1위 후보를 강조.
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LinkButton, StepBar } from "@/components/ui";
import Avatar from "@/components/Avatar";
import type { TallyItem } from "@/lib/types";

export default function ResultPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [tallies, setTallies] = useState<TallyItem[]>([]);
  const [voterCount, setVoterCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/events/${eventId}/results`, {
          cache: "no-store",
        });
        const data = await res.json();
        setTallies(data.tallies ?? []);
        setVoterCount(data.voterCount ?? 0);
        setLoaded(true);
      } catch {
        // 네트워크 순단은 다음 폴링에서 회복
      }
    }
    poll();
    timer.current = setInterval(poll, 2000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [eventId]);

  const sorted = [...tallies].sort((a, b) => b.votes - a.votes);
  const totalVotes = tallies.reduce((s, t) => s + t.votes, 0);
  const maxVotes = sorted[0]?.votes ?? 0;
  const winner = maxVotes > 0 ? sorted[0] : null;

  return (
    <main className="screen px-5 pb-28">
      <StepBar step={2} />

      <header className="pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">📊 투표 현황</h1>
          <span className="flex items-center gap-1.5 text-xs text-stone-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            실시간
          </span>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          {voterCount}명 참여 · 총 {totalVotes}표
        </p>
      </header>

      {winner && (
        <div className="mt-4 rounded-2xl bg-orange-500 p-4 text-white shadow-sm">
          <div className="text-xs font-semibold opacity-80">현재 1위 🏆</div>
          <div className="mt-0.5 text-xl font-extrabold">
            {winner.candidate.name}
          </div>
          {winner.candidate.meta?.note ? (
            <div className="text-sm opacity-90">{winner.candidate.meta.note}</div>
          ) : null}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {!loaded ? (
          <p className="py-10 text-center text-stone-400">집계 불러오는 중…</p>
        ) : (
          sorted.map((t, i) => {
            const pct = maxVotes > 0 ? (t.votes / maxVotes) * 100 : 0;
            const isTop = t.votes === maxVotes && maxVotes > 0;
            return (
              <div key={t.candidate.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-stone-700">
                    {i + 1}. {t.candidate.name}
                  </span>
                  <span className="tabular-nums text-stone-500">
                    {t.votes}표
                  </span>
                </div>
                <div className="h-9 overflow-hidden rounded-xl bg-stone-100">
                  <div
                    className={`h-full rounded-xl transition-all duration-500 ${
                      isTop ? "bg-orange-500" : "bg-stone-300"
                    }`}
                    style={{ width: `${Math.max(pct, t.votes > 0 ? 8 : 0)}%` }}
                  />
                </div>
                {t.voters.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {t.voters.map((v, vi) => (
                      <span
                        key={`${v.name}-${vi}`}
                        className="flex items-center gap-1 rounded-full bg-white py-0.5 pl-0.5 pr-2 text-xs text-stone-600 ring-1 ring-stone-200"
                      >
                        <Avatar name={v.name} photo={v.photo} size={18} />
                        {v.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md flex-col gap-2 border-t border-stone-200/70 bg-background/95 p-4 backdrop-blur">
        {totalVotes > 0 ? (
          <LinkButton href={`/e/${eventId}/plan`}>
            🤖 이걸로 실행 계획 만들기
          </LinkButton>
        ) : (
          <div className="rounded-2xl bg-stone-100 py-4 text-center text-sm text-stone-400">
            첫 투표를 기다리는 중…
          </div>
        )}
        <Link
          href={`/e/${eventId}`}
          className="text-center text-sm font-medium text-stone-500"
        >
          ← 나도 투표하기
        </Link>
      </div>
    </main>
  );
}
