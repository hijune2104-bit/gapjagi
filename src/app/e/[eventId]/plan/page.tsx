"use client";

// 3차: 추천안 — 투표 결과로 Groq가 만든 실행 문서.
// 진입 시 저장된 플랜이 있으면 보여주고, 없으면 생성(POST)합니다.
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StepBar } from "@/components/ui";
import StaticMap from "@/components/StaticMap";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
  type CalendarEvent,
} from "@/features/plan/calendar";
import type { DinnerConfig, PlanContent } from "@/lib/types";

export default function PlanPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [plan, setPlan] = useState<PlanContent | null>(null);
  const [status, setStatus] = useState<"loading" | "generating" | "ready" | "error">(
    "loading"
  );
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [eventTitle, setEventTitle] = useState("갑자기 회식");
  const [scheduledAt, setScheduledAt] = useState(""); // datetime-local 문자열

  const generate = useCallback(async () => {
    setStatus("generating");
    try {
      const res = await fetch(`/api/events/${eventId}/plan`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlan(data.plan.content);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [eventId]);

  useEffect(() => {
    // 이미 만든 플랜이 있으면 재사용, 없으면 생성
    fetch(`/api/events/${eventId}/plan`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.plan?.content) {
          setPlan(data.plan.content);
          setStatus("ready");
        } else {
          generate();
        }
      })
      .catch(() => generate());
  }, [eventId, generate]);

  // 이벤트 정보(제목·회식 일시) 로드. 일시가 없으면 다가오는 금요일 저녁 7시로 기본값.
  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.event?.title) setEventTitle(data.event.title);
        const cfg = data.event?.config as DinnerConfig | undefined;
        setScheduledAt(cfg?.scheduledAt || defaultFridayEvening());
      })
      .catch(() => setScheduledAt(defaultFridayEvening()));
  }, [eventId]);

  async function copyAnnouncement() {
    if (!plan) return;
    await navigator.clipboard.writeText(plan.announcement);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (status === "loading" || status === "generating") {
    return (
      <main className="screen items-center justify-center px-5">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
          <p className="font-semibold text-stone-600">
            {status === "generating"
              ? "AI가 실행 계획을 짜는 중…"
              : "불러오는 중…"}
          </p>
          <p className="text-sm text-stone-400">
            투표 결과로 공지문·타임라인·회비까지 정리하고 있어요
          </p>
        </div>
      </main>
    );
  }

  if (status === "error" || !plan) {
    return (
      <main className="screen items-center justify-center px-5">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-stone-500">
          <p>계획 생성에 실패했어요 😢</p>
          <button
            onClick={generate}
            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  const won = plan.feeSplit;

  return (
    <main className="screen px-5 pb-24">
      <StepBar step={3} />

      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">✅ 실행 계획 완성!</h1>
        <p className="mt-1 text-sm text-stone-500">
          단톡방에 그대로 공유하면 끝이에요.
        </p>
      </header>

      {/* 확정 식당 */}
      <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-orange-500">
              📍 확정 장소
            </div>
            <div className="mt-0.5 text-xl font-extrabold text-stone-800">
              {plan.reservation.place}
            </div>
            {plan.reservation.address && (
              <div className="mt-0.5 text-[13px] text-stone-500">
                {plan.reservation.address}
              </div>
            )}
            <div className="mt-1 text-sm text-stone-500">
              💡 {plan.reservation.tip}
            </div>
            {plan.reservation.placeUrl && (
              <a
                href={plan.reservation.placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block rounded-lg bg-stone-100 px-3 py-1.5 text-[12px] font-semibold text-stone-600 active:scale-95"
              >
                🗺 지도·리뷰 보기 ›
              </a>
            )}
          </div>
          {plan.reservation.lat && plan.reservation.lng ? (
            <a
              href={plan.reservation.placeUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 overflow-hidden rounded-xl ring-1 ring-stone-200"
              title="카카오맵에서 보기"
            >
              <StaticMap
                lat={plan.reservation.lat}
                lng={plan.reservation.lng}
                size={88}
              />
            </a>
          ) : null}
        </div>
      </div>

      {/* 공지문 */}
      <Section title="📢 단톡방 공지문">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
            {plan.announcement}
          </p>
          <button
            onClick={copyAnnouncement}
            className="mt-3 w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            {copied ? "복사됐어요! 👍" : "공지문 복사하기"}
          </button>
        </div>
      </Section>

      {/* 회비 */}
      <Section title="💰 회비">
        <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
          <div>
            <div className="text-sm text-stone-500">1인당</div>
            <div className="text-2xl font-extrabold text-stone-800">
              {won.perPerson.toLocaleString()}원
            </div>
            {won.note ? (
              <div className="mt-0.5 text-xs text-stone-400">{won.note}</div>
            ) : null}
          </div>
          {won.total > 0 && (
            <div className="text-right">
              <div className="text-sm text-stone-500">예상 총액</div>
              <div className="text-lg font-bold text-stone-600">
                {won.total.toLocaleString()}원
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* 타임라인 */}
      <Section title="🕒 타임라인">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
          {plan.timeline.map((t, i) => (
            <div
              key={i}
              className="flex gap-3 border-l-2 border-orange-200 py-2 pl-4 last:pb-0"
            >
              <span className="w-12 shrink-0 text-sm font-bold text-orange-500">
                {t.time}
              </span>
              <span className="text-[15px] text-stone-700">{t.activity}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 체크리스트 */}
      <Section title="📋 준비 체크리스트">
        <div className="flex flex-col gap-2">
          {plan.checklist.map((item, i) => (
            <button
              key={i}
              onClick={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}
              className="flex items-center gap-3 rounded-xl bg-white p-3.5 text-left shadow-sm ring-1 ring-stone-200/70 active:scale-[0.99]"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm ${
                  checked[i]
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-stone-300"
                }`}
              >
                {checked[i] ? "✓" : ""}
              </span>
              <span
                className={`text-[15px] ${
                  checked[i]
                    ? "text-stone-400 line-through"
                    : "text-stone-700"
                }`}
              >
                {item}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* 캘린더 등록 */}
      <Section title="📅 캘린더에 등록">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
          <label className="mb-1.5 block text-xs font-semibold text-stone-500">
            회식 일시
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-xl bg-stone-50 px-4 py-3 text-[15px] ring-1 ring-stone-200 outline-none focus:ring-orange-400"
          />
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={
                calEvent(eventTitle, plan, scheduledAt)
                  ? buildGoogleCalendarUrl(calEvent(eventTitle, plan, scheduledAt)!)
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full rounded-2xl py-3.5 text-center text-sm font-semibold active:scale-[0.98] ${
                scheduledAt
                  ? "bg-orange-500 text-white"
                  : "pointer-events-none bg-stone-200 text-stone-400"
              }`}
            >
              📅 구글 캘린더에 추가
            </a>
            <button
              onClick={() => {
                const ev = calEvent(eventTitle, plan, scheduledAt);
                if (ev) downloadIcs(ev, "회식.ics");
              }}
              disabled={!scheduledAt}
              className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-stone-600 ring-1 ring-stone-200 active:scale-[0.98] disabled:opacity-40"
            >
              📎 .ics 파일 저장 (아이폰·아웃룩 등)
            </button>
          </div>
          <p className="mt-2 text-center text-[12px] text-stone-400">
            버튼을 누르면 제목·시간·장소·설명이 채워진 채로 열려요
          </p>
        </div>
      </Section>

      <Link
        href={`/e/${eventId}/share`}
        className="mt-6 block w-full rounded-2xl bg-stone-800 py-4 text-center text-base font-semibold text-white active:scale-[0.98]"
      >
        🔗 공유용 페이지 만들기
      </Link>

      <div className="mt-6 flex flex-col gap-2 text-center">
        <button
          onClick={generate}
          className="text-sm font-medium text-stone-400"
        >
          🔄 다른 버전으로 다시 만들기
        </button>
        <Link
          href={`/e/${eventId}/result`}
          className="text-sm font-medium text-stone-500"
        >
          ← 투표 결과로
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-sm font-bold text-stone-600">{title}</h2>
      {children}
    </section>
  );
}

// 다가오는 금요일 저녁 7시를 datetime-local 문자열("YYYY-MM-DDTHH:mm")로 반환.
function defaultFridayEvening(): string {
  const d = new Date();
  const day = d.getDay(); // 0=일 ~ 6=토
  const add = (5 - day + 7) % 7 || 7; // 다음 금요일까지 남은 일수 (오늘이 금요일이면 다음 주)
  d.setDate(d.getDate() + add);
  d.setHours(19, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// 플랜 + 일시로 캘린더 이벤트를 구성. 일시가 유효하지 않으면 null.
function calEvent(
  title: string,
  plan: PlanContent,
  scheduledAt: string
): CalendarEvent | null {
  if (!scheduledAt) return null;
  const start = new Date(scheduledAt);
  if (isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 기본 2시간

  const location =
    plan.reservation.place +
    (plan.reservation.address ? ` (${plan.reservation.address})` : "");

  const details = [
    plan.announcement,
    "",
    "🕒 타임라인",
    ...plan.timeline.map((t) => `- ${t.time} ${t.activity}`),
    "",
    "📋 체크리스트",
    ...plan.checklist.map((c) => `- ${c}`),
    "",
    `💰 회비: 1인 ${plan.feeSplit.perPerson.toLocaleString()}원`,
    plan.reservation.placeUrl ? `📍 ${plan.reservation.placeUrl}` : "",
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return { title, start, end, details, location };
}
