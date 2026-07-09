// 랜딩: 상황 3종 선택 (회식만 활성화, 나머지는 '곧')
import Link from "next/link";
import AuthStatus from "@/features/auth/AuthStatus";

const situations = [
  {
    key: "dinner",
    emoji: "🍻",
    title: "갑자기 회식",
    desc: "인원·예산·분위기 고르면 식당 투표부터 공지문까지",
    href: "/create/dinner",
    active: true,
  },
  {
    key: "trip",
    emoji: "✈️",
    title: "갑자기 여행",
    desc: "Day별 일정표와 예약 체크리스트",
    href: "#",
    active: false,
  },
  {
    key: "workshop",
    emoji: "🏢",
    title: "갑자기 워크샵",
    desc: "장소 투표와 세션 시간표, 준비물까지",
    href: "#",
    active: false,
  },
];

export default function Home() {
  return (
    <main className="screen px-5 pb-10">
      <header className="pt-8 pb-8">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            ⚡ 3분 안에 실행 계획으로
          </div>
          <AuthStatus />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight">
          갑자기 잡힌 일정,
          <br />
          <span className="text-orange-500">다 같이 정하고</span> 바로 실행.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-stone-500">
          뭘 정해야 할지 서비스가 알려줘요. 링크 공유로 팀원 투표받고, 공지문까지
          자동으로 만들어 드려요.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <p className="px-1 text-sm font-semibold text-stone-400">
          어떤 상황이세요?
        </p>
        {situations.map((s) => {
          const inner = (
            <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                {s.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-stone-800">{s.title}</h2>
                  {!s.active && (
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-400">
                      곧
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[13px] text-stone-500">
                  {s.desc}
                </p>
              </div>
              <span className="text-stone-300">›</span>
            </div>
          );

          return s.active ? (
            <Link
              key={s.key}
              href={s.href}
              className="transition active:scale-[0.98]"
            >
              {inner}
            </Link>
          ) : (
            <div key={s.key} className="cursor-not-allowed opacity-55">
              {inner}
            </div>
          );
        })}
      </section>

      <div className="mt-auto pt-10 text-center text-xs text-stone-400">
        갑자기 · 해커톤 프로토타입
      </div>
    </main>
  );
}
