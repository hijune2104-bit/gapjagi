// 홈 (C-01): 상황 모듈 선택 + 내 참여 목록. 회식 활성 / 회의·여행·워크샵은 준비 중.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import AuthStatus from "@/features/auth/AuthStatus";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import type { MyEventSummary } from "@/lib/types";

const MODULE_EMOJI: Record<string, string> = {
  dinner: "🍻",
  trip: "✈️",
  workshop: "🏢",
};

// 참여 카드에서 상태 뱃지 문구 + 이동 경로 결정
function statusLabel(ev: MyEventSummary): string {
  if (ev.has_plan) return "✅ 추천안 완성";
  if (ev.status === "voting") return "🗳 투표 중";
  if (ev.status === "closed") return "⏳ 마감";
  return "완료";
}
function destFor(ev: MyEventSummary): string {
  if (ev.has_plan) return `/e/${ev.id}/plan`;
  if (ev.status === "voting") return `/e/${ev.id}`;
  return `/e/${ev.id}/result`;
}

const mods = [
  {
    key: "dinner",
    emoji: "🍻",
    title: "갑자기 회식",
    desc: "인원·예산·분위기 고르면 식당 투표부터 공지까지",
    href: "/create/dinner",
    soon: false,
  },
  {
    key: "meeting",
    emoji: "📅",
    title: "갑자기 회의",
    desc: "가능 시간 모아 최적 시간·회의실까지",
    href: "#",
    soon: true,
  },
  {
    key: "trip",
    emoji: "✈️",
    title: "갑자기 여행",
    desc: "Day별 일정표와 예약 체크리스트",
    href: "#",
    soon: true,
  },
  {
    key: "workshop",
    emoji: "🏢",
    title: "갑자기 워크샵",
    desc: "장소 투표·세션 시간표·준비물",
    href: "#",
    soon: true,
  },
];

export default function Home() {
  const { user } = useCurrentUser();
  const [myEvents, setMyEvents] = useState<MyEventSummary[]>([]);

  useEffect(() => {
    if (!user?.account) {
      setMyEvents([]);
      return;
    }
    fetch(`/api/events/mine?account=${encodeURIComponent(user.account)}`)
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => setMyEvents(d.events ?? []))
      .catch(() => setMyEvents([]));
  }, [user]);

  return (
    <Shell back={false} headerRight={<AuthStatus />}>
      <div className="kicker">갑자기 잡힌 일정</div>
      <h1 className="title">
        3분 안에
        <br />
        실행 계획으로.
      </h1>
      <p className="sub">
        뭘 정해야 할지 서비스가 대신 물어봐요. 링크로 팀원 투표받고, 공지문까지
        자동으로.
      </p>

      {/* 내 참여 목록 (로그인 + 참여 이벤트 있을 때만) */}
      {myEvents.length > 0 && (
        <>
          <div className="sectlabel">
            <h2>내 참여 목록</h2>
            <span>{myEvents.length}개</span>
          </div>
          <div className="tscroll">
            {myEvents.map((ev) => (
              <Link key={ev.id} href={destFor(ev)} className="tcard">
                <div className="temo">{MODULE_EMOJI[ev.module_type] ?? "📌"}</div>
                <h4>{ev.title}</h4>
                <div className="by">
                  👥 {ev.participant_count}명 · 🗳 {ev.vote_count}표
                </div>
                <div className="used">{statusLabel(ev)}</div>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="mods">
        {mods.map((m) =>
          m.soon ? (
            <div key={m.key} className="mod soon">
              <span className="emo">{m.emoji}</span>
              <div>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </div>
              <span className="go" />
            </div>
          ) : (
            <Link key={m.key} href={m.href} className="mod">
              <span className="emo">{m.emoji}</span>
              <div>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </div>
              <span className="go">›</span>
            </Link>
          )
        )}
      </div>

      <div className="homefoot">
        <Link href="/revenue">
          <button>갑자기는 어떻게 돈을 버나요?</button>
        </Link>
      </div>
    </Shell>
  );
}
