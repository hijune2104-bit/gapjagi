"use client";

// 3차 추천안 (D-09·D-10·D-11·C-04) — Groq 실행 문서 + 회비 + 공지 + 체크리스트 + 알림 + 캘린더.
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Shell from "@/components/Shell";
import StaticMap from "@/components/StaticMap";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
  type CalendarEvent,
} from "@/features/plan/calendar";
import type { DinnerConfig, PlanContent } from "@/lib/types";

const ALERTS = ["확정 즉시 발송", "3일 전 리마인드", "당일 아침 9시", "시작 2~3시간 전"];

export default function PlanPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();

  const [plan, setPlan] = useState<PlanContent | null>(null);
  const [status, setStatus] = useState<"loading" | "generating" | "ready" | "error">("loading");
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [eventTitle, setEventTitle] = useState("갑자기 회식");
  const [scheduledAt, setScheduledAt] = useState("");
  const [alerts, setAlerts] = useState<Set<string>>(new Set(ALERTS));

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
    fetch(`/api/events/${eventId}/plan`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.plan?.content) {
          setPlan(data.plan.content);
          setStatus("ready");
        } else generate();
      })
      .catch(() => generate());
  }, [eventId, generate]);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.event?.title) setEventTitle(data.event.title);
        const cfg = data.event?.config as DinnerConfig | undefined;
        setScheduledAt(cfg?.scheduledAt || defaultFri());
      })
      .catch(() => setScheduledAt(defaultFri()));
  }, [eventId]);

  async function copyAnnouncement() {
    if (!plan) return;
    await navigator.clipboard.writeText(plan.announcement);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (status === "loading" || status === "generating")
    return (
      <Shell steps={["선택", "의논", "완성"]} activeStep={2}>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div
            style={{
              width: 40,
              height: 40,
              margin: "0 auto 18px",
              border: "4px solid var(--coral-bg)",
              borderTopColor: "var(--coral)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ fontWeight: 800 }}>
            {status === "generating" ? "AI가 실행 계획을 짜는 중…" : "불러오는 중…"}
          </p>
          <p className="helper">투표 결과로 공지·회비·타임라인을 정리하고 있어요</p>
        </div>
      </Shell>
    );

  if (status === "error" || !plan)
    return (
      <Shell steps={["선택", "의논", "완성"]} activeStep={2}>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="helper">계획 생성에 실패했어요 😢</p>
          <button className="cta" style={{ marginTop: 16 }} onClick={generate}>
            다시 시도
          </button>
        </div>
      </Shell>
    );

  const r = plan.reservation;
  const cal = calEvent(eventTitle, plan, scheduledAt);

  return (
    <Shell
      steps={["선택", "의논", "완성"]}
      activeStep={2}
      cta={
        <button className="cta" onClick={() => router.push(`/e/${eventId}/share`)}>
          🔗 공유용 페이지 만들기
        </button>
      }
    >
      <div className="winner">
        <div className="crown">✅</div>
        <h2>{r.place}</h2>
        <p>{r.address || "실행 계획이 완성됐어요"}</p>
        <div className="bar2">💡 {r.tip}</div>
      </div>

      {/* 지도 + 회비 */}
      {r.lat && r.lng && (
        <a
          href={r.placeUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", borderRadius: 14, overflow: "hidden", marginBottom: 12, border: "1px solid var(--line)" }}
        >
          <StaticMap lat={r.lat} lng={r.lng} size={360} zoom={16} className="w-full" />
        </a>
      )}

      <div className="cardbox">
        <h3>💰 회비</h3>
        <div className="kv">
          <span className="k">1인당</span>
          <span className="v big">{plan.feeSplit.perPerson.toLocaleString()}원</span>
        </div>
        {plan.feeSplit.total > 0 && (
          <div className="kv">
            <span className="k">예상 총액</span>
            <span className="v">{plan.feeSplit.total.toLocaleString()}원</span>
          </div>
        )}
        {plan.feeSplit.note && (
          <div className="kv">
            <span className="k">계산</span>
            <span className="v" style={{ fontWeight: 500, color: "var(--muted)" }}>
              {plan.feeSplit.note}
            </span>
          </div>
        )}
      </div>

      {/* 공지문 */}
      <div className="sectlabel" style={{ margin: "24px 0 12px" }}>
        <h2>📢 단톡방 공지문</h2>
      </div>
      <div className="notice">{plan.announcement}</div>
      <button className="cta" onClick={copyAnnouncement} style={{ marginBottom: 8 }}>
        {copied ? "복사됐어요! 👍" : "공지문 복사하기"}
      </button>

      {/* 타임라인 */}
      <div className="cardbox" style={{ marginTop: 16 }}>
        <h3>🕒 타임라인</h3>
        {plan.timeline.map((t, i) => (
          <div key={i} className="kv">
            <span className="k" style={{ fontWeight: 800, color: "var(--coral)" }}>
              {t.time}
            </span>
            <span className="v" style={{ fontWeight: 500 }}>
              {t.activity}
            </span>
          </div>
        ))}
      </div>

      {/* 체크리스트 */}
      <div className="cardbox">
        <h3>📋 예약 체크리스트</h3>
        {plan.checklist.map((item, i) => (
          <div
            key={i}
            className={`check${checked[i] ? " done" : ""}`}
            onClick={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}
          >
            <div className="box">{checked[i] ? "✓" : ""}</div>
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* 알림 예약 (C-04) */}
      <div className="cardbox">
        <h3>🔔 알림 예약</h3>
        <div className="chips">
          {ALERTS.map((a) => (
            <button
              key={a}
              className={`chip sm${alerts.has(a) ? " on" : ""}`}
              onClick={() =>
                setAlerts((prev) => {
                  const n = new Set(prev);
                  n.has(a) ? n.delete(a) : n.add(a);
                  return n;
                })
              }
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 */}
      <div className="cardbox">
        <h3>📅 캘린더</h3>
        <input
          type="datetime-local"
          className="tinput"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <a
          className="cta"
          href={cal ? buildGoogleCalendarUrl(cal) : "#"}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: 8 }}
        >
          📅 구글 캘린더에 추가
        </a>
        <button
          className="cta ghost"
          onClick={() => cal && downloadIcs(cal, "회식.ics")}
        >
          📎 .ics 저장 (아이폰·아웃룩)
        </button>
      </div>

      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button
          onClick={generate}
          style={{ background: "none", border: "none", fontSize: 13, fontWeight: 700, color: "var(--muted)", textDecoration: "underline", cursor: "pointer" }}
        >
          🔄 다른 버전으로 다시 만들기
        </button>
      </div>
    </Shell>
  );
}

function defaultFri(): string {
  const d = new Date();
  const add = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  d.setHours(19, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T19:00`;
}

function calEvent(title: string, plan: PlanContent, scheduledAt: string): CalendarEvent | null {
  if (!scheduledAt) return null;
  const start = new Date(scheduledAt);
  if (isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 2 * 3600 * 1000);
  const location = plan.reservation.place + (plan.reservation.address ? ` (${plan.reservation.address})` : "");
  const details = [
    plan.announcement,
    "",
    "🕒 타임라인",
    ...plan.timeline.map((t) => `- ${t.time} ${t.activity}`),
    "",
    `💰 회비: 1인 ${plan.feeSplit.perPerson.toLocaleString()}원`,
    plan.reservation.placeUrl ? `📍 ${plan.reservation.placeUrl}` : "",
  ].join("\n");
  return { title, start, end, details, location };
}
