// 실행계획 공유 페이지 (C-03/D-09) — 서버 렌더 읽기 전용, 링크로 공유.
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEvent,
  getLatestPlan,
  getParticipants,
} from "@/features/event/queries";
import type { DinnerConfig, PlanContent } from "@/lib/types";
import Shell from "@/components/Shell";
import StaticMap from "@/components/StaticMap";
import Avatar from "@/components/Avatar";
import ShareBar from "./ShareBar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatSchedule(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]}) ${ampm} ${h12}:${mm}`;
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
  const participants = await getParticipants(eventId);
  const config = event.config as DinnerConfig;
  const schedule = formatSchedule(config.scheduledAt);

  if (!planRow) {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="helper">아직 실행계획이 만들어지지 않았어요.</p>
          <Link href={`/e/${eventId}/plan`} className="cta" style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}>
            실행계획 만들기
          </Link>
        </div>
      </Shell>
    );
  }

  const plan = planRow.content as PlanContent;
  const r = plan.reservation;

  return (
    <Shell cta={<ShareBar title={`${event.title} 실행계획`} />}>
      <div className="winner">
        <div className="crown">🍻</div>
        <h2>{event.title}</h2>
        <p>{r.place}</p>
        <div className="bar2">
          👥 {config.headcount}명 · 1인 {plan.feeSplit.perPerson.toLocaleString()}원
        </div>
      </div>

      <div className="cardbox">
        <h3>📍 장소 · 일시</h3>
        <div className="kv">
          <span className="k">장소</span>
          <span className="v">{r.place}</span>
        </div>
        {r.address && (
          <div className="kv">
            <span className="k">주소</span>
            <span className="v" style={{ fontWeight: 500 }}>{r.address}</span>
          </div>
        )}
        {schedule && (
          <div className="kv">
            <span className="k">일시</span>
            <span className="v">{schedule}</span>
          </div>
        )}
      </div>

      {r.lat && r.lng && (
        <a
          href={r.placeUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", borderRadius: 14, overflow: "hidden", marginBottom: 12, border: "1px solid var(--line)" }}
        >
          <StaticMap lat={r.lat} lng={r.lng} size={360} className="w-full" />
        </a>
      )}

      <div className="sectlabel" style={{ margin: "8px 0 12px" }}>
        <h2>📢 공지</h2>
      </div>
      <div className="notice">{plan.announcement}</div>

      <div className="cardbox" style={{ marginTop: 16 }}>
        <h3>🕒 타임라인</h3>
        {plan.timeline.map((t, i) => (
          <div key={i} className="kv">
            <span className="k" style={{ fontWeight: 800, color: "var(--coral)" }}>{t.time}</span>
            <span className="v" style={{ fontWeight: 500 }}>{t.activity}</span>
          </div>
        ))}
      </div>

      <div className="cardbox">
        <h3>📋 준비물</h3>
        {plan.checklist.map((item, i) => (
          <div key={i} className="check">
            <div className="box" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      {participants.length > 0 && (
        <div className="cardbox">
          <h3>👥 참여자 {participants.length}명</h3>
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

      <p className="addisclosure">갑자기로 3분 만에 만든 실행계획 ⚡</p>
    </Shell>
  );
}
