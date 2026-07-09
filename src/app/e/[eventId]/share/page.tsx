// 실행계획 공유 페이지 (서버 컴포넌트, 읽기 전용).
// 저장된 플랜을 DB에서 직접 읽어 예쁜 HTML로 렌더링합니다. 링크로 공유 가능.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent, getLatestPlan } from "@/features/event/queries";
import type { DinnerConfig, PlanContent } from "@/lib/types";
import MiniMap from "@/components/MiniMap";
import ShareBar from "./ShareBar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // 항상 최신 플랜 반영

// "2026-07-10T19:00" → "2026년 7월 10일 (금) 오후 7:00"
function formatSchedule(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${
    days[d.getDay()]
  }) ${ampm} ${h12}:${mm}`;
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();

  const planRow = await getLatestPlan(eventId);
  const config = event.config as DinnerConfig;
  const schedule = formatSchedule(config.scheduledAt);

  // 아직 추천안이 없으면 안내
  if (!planRow) {
    return (
      <main className="screen items-center justify-center px-5 text-center">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-stone-500">아직 실행계획이 만들어지지 않았어요.</p>
          <Link
            href={`/e/${eventId}/plan`}
            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
          >
            실행계획 만들기
          </Link>
        </div>
      </main>
    );
  }

  const plan = planRow.content as PlanContent;

  return (
    <main className="screen bg-white px-5 pb-12 print:max-w-full">
      {/* 액션 바 */}
      <div className="pt-4">
        <ShareBar title={`${event.title} 실행계획`} />
      </div>

      {/* 히어로 헤더 */}
      <header className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 p-6 text-white shadow-sm">
        <div className="text-xs font-semibold opacity-80">🍻 갑자기 회식</div>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight">
          {event.title}
        </h1>
        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="opacity-70">📍 장소</span>
            <span className="font-semibold">{plan.reservation.place}</span>
          </div>
          {schedule && (
            <div className="flex items-center gap-2">
              <span className="opacity-70">🗓 일시</span>
              <span className="font-semibold">{schedule}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="opacity-70">👥 인원</span>
            <span className="font-semibold">{config.headcount}명</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-70">💰 회비</span>
            <span className="font-semibold">
              1인 {plan.feeSplit.perPerson.toLocaleString()}원
            </span>
          </div>
        </div>
        {plan.reservation.address && (
          <div className="mt-3 rounded-xl bg-white/15 px-3 py-2 text-[13px]">
            {plan.reservation.address}
            {plan.reservation.placeUrl && (
              <a
                href={plan.reservation.placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 underline"
              >
                지도·리뷰 ›
              </a>
            )}
          </div>
        )}
      </header>

      {/* 위치 지도 */}
      {plan.reservation.lat && plan.reservation.lng ? (
        <Block title="🗺 위치">
          <MiniMap
            lat={plan.reservation.lat}
            lng={plan.reservation.lng}
            className="h-44 w-full rounded-xl"
          />
          {plan.reservation.placeUrl && (
            <a
              href={plan.reservation.placeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[13px] font-medium text-orange-600 underline"
            >
              카카오맵에서 길찾기·리뷰 ›
            </a>
          )}
        </Block>
      ) : null}

      {/* 공지문 */}
      <Block title="📢 공지">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
          {plan.announcement}
        </p>
      </Block>

      {/* 타임라인 */}
      <Block title="🕒 타임라인">
        <div className="space-y-0">
          {plan.timeline.map((t, i) => (
            <div
              key={i}
              className="flex gap-3 border-l-2 border-orange-200 py-2 pl-4"
            >
              <span className="w-12 shrink-0 text-sm font-bold text-orange-500">
                {t.time}
              </span>
              <span className="text-[15px] text-stone-700">{t.activity}</span>
            </div>
          ))}
        </div>
      </Block>

      {/* 회비 */}
      <Block title="💰 회비 정산">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm text-stone-500">1인당</div>
            <div className="text-3xl font-extrabold text-stone-800">
              {plan.feeSplit.perPerson.toLocaleString()}
              <span className="text-lg">원</span>
            </div>
          </div>
          {plan.feeSplit.total > 0 && (
            <div className="text-right text-sm text-stone-500">
              총 {plan.feeSplit.total.toLocaleString()}원
            </div>
          )}
        </div>
        {plan.feeSplit.note && (
          <div className="mt-1 text-xs text-stone-400">{plan.feeSplit.note}</div>
        )}
      </Block>

      {/* 체크리스트 */}
      <Block title="📋 준비물 체크리스트">
        <ul className="space-y-2">
          {plan.checklist.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[15px]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-stone-300 text-[11px]" />
              <span className="text-stone-700">{item}</span>
            </li>
          ))}
        </ul>
      </Block>

      <footer className="mt-8 text-center text-xs text-stone-400">
        갑자기로 3분 만에 만든 실행계획 ⚡
      </footer>
    </main>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 px-1 text-sm font-bold text-stone-500">{title}</h2>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70 print:ring-stone-300">
        {children}
      </div>
    </section>
  );
}
