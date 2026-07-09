"use client";

// 2차 결과 (D-08) — 폴링(2초) 실시간 집계. 1위 강조 + 투표자 아바타.
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import type { TallyItem } from "@/lib/types";

export default function ResultPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();
  const [tallies, setTallies] = useState<TallyItem[]>([]);
  const [voterCount, setVoterCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/events/${eventId}/results`, { cache: "no-store" });
        const data = await res.json();
        setTallies(data.tallies ?? []);
        setVoterCount(data.voterCount ?? 0);
        setLoaded(true);
      } catch {}
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
    <Shell
      steps={["선택", "의논", "완성"]}
      activeStep={1}
      cta={
        totalVotes > 0 ? (
          <button className="cta" onClick={() => router.push(`/e/${eventId}/plan`)}>
            🤖 이걸로 실행 계획 만들기
          </button>
        ) : (
          <button className="cta" disabled>
            첫 투표를 기다리는 중…
          </button>
        )
      }
    >
      <div className="kicker">STEP 2 · 실시간 투표</div>
      <h1 className="title" style={{ fontSize: 23 }}>
        지금 어디가
        <br />
        앞서고 있을까요?
      </h1>
      <div className="livebar">
        <span className="live">
          <span className="d" />
          실시간
        </span>
        <span>
          {voterCount}명 참여 · 총 {totalVotes}표
        </span>
      </div>

      {winner && (
        <div className="winner">
          <div className="crown">🏆</div>
          <h2>{winner.candidate.name}</h2>
          <p>현재 1위 · {winner.votes}표</p>
        </div>
      )}

      {!loaded ? (
        <p className="helper" style={{ textAlign: "center", padding: "30px 0" }}>
          집계 불러오는 중…
        </p>
      ) : (
        sorted.map((t, i) => {
          const pct = maxVotes > 0 ? (t.votes / maxVotes) * 100 : 0;
          const top = t.votes === maxVotes && maxVotes > 0;
          return (
            <div key={t.candidate.id} className="cand" style={{ cursor: "default" }}>
              <div className="fill" style={{ width: `${pct}%` }} />
              <div className="row1">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4>
                    {i + 1}. {t.candidate.name}
                  </h4>
                  {t.voters.length > 0 && (
                    <div className="avatars">
                      {t.voters.slice(0, 8).map((v, vi) => (
                        <i key={`${v.name}-${vi}`} title={v.name} style={{ background: "#EABF9F" }}>
                          {v.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.photo}
                              alt={v.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            v.name.slice(0, 1)
                          )}
                        </i>
                      ))}
                    </div>
                  )}
                </div>
                <div className="votes">
                  <b>{t.votes}</b>
                  <span>표{top ? " · 1위" : ""}</span>
                </div>
              </div>
            </div>
          );
        })
      )}

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button
          onClick={() => router.push(`/e/${eventId}`)}
          className="homefoot"
          style={{ background: "none", border: "none" }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", textDecoration: "underline" }}>
            ← 나도 투표하기
          </span>
        </button>
      </div>
    </Shell>
  );
}
