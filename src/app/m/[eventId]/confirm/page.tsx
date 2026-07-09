"use client";

// 회의 확정 마무리 (M-11·M-12·M-13·M-14) — 회의실·준비물·알림·공지. 회의실/알림은 목업.
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import { slotLabel } from "@/features/meeting/grid";
import {
  ALERT_ITEMS,
  MEETING_ROOMS,
  PREP_ITEMS,
  roomLabel,
} from "@/features/meeting/constants";
import type { MeetingConfirmation } from "@/lib/types";

export default function MeetingConfirmPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const router = useRouter();

  const [conf, setConf] = useState<MeetingConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("주간 팀 회의");

  const [roomId, setRoomId] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [prep, setPrep] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>(ALERT_ITEMS);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/meetings/${eventId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.confirmation) {
          router.replace(`/m/${eventId}/result`);
          return;
        }
        setConf(d.confirmation);
        setTitle(d.event?.title ?? "회의");
        setPrep(d.confirmation.prep ?? []);
        setBooked(Boolean(d.confirmation.roomBooked));
        setRoomId(d.confirmation.roomId ?? null);
      })
      .finally(() => setLoading(false));
  }, [eventId, router]);

  // 인원에 맞는 추천 회의실 (예약 가능 + 수용 가능한 가장 작은 방, 없으면 온라인)
  const recommendedId = useMemo(() => {
    const n = conf?.attendeeCount ?? 0;
    const fit = MEETING_ROOMS.filter((r) => r.status === "ok" && r.cap >= n).sort(
      (a, b) => a.cap - b.cap
    )[0];
    return fit?.id ?? "O";
  }, [conf]);

  const effectiveRoomId = roomId ?? recommendedId;
  const room = MEETING_ROOMS.find((r) => r.id === effectiveRoomId) ?? null;

  function togglePrep(p: string) {
    setPrep((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }
  function toggleAlert(a: string) {
    setAlerts((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  // 회의실/준비물 변경분을 서버에 다시 저장 (예약 상태 포함)
  async function persist(nextBooked: boolean) {
    if (!conf) return;
    setSaving(true);
    try {
      await fetch(`/api/meetings/${eventId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...conf,
          roomId: effectiveRoomId,
          roomName: roomLabel(room),
          roomBooked: nextBooked,
          prep,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  function noticeText(): string {
    if (!conf) return "";
    const label = slotLabel(conf.slot);
    const { hour } = { hour: Number(conf.slot.slice(conf.slot.lastIndexOf("-") + 1)) };
    const ex = conf.excluded ?? [];
    return `[회의 일정 확정 📅]

🗓️ 일시: ${label}~${hour + 1}:00
📍 장소: ${roomLabel(room)}${booked ? " (예약완료)" : ""}
👥 참석: ${conf.attendeeCount}명${ex.length ? ` (${ex.join(", ")}님은 개별 공유)` : ""}${
      prep.length ? `\n📋 준비: ${prep.join(", ")}` : ""
    }

확정됐습니다! 캘린더 초대 보냈어요 :)`;
  }

  async function copyNotice() {
    try {
      await navigator.clipboard.writeText(noticeText());
    } catch {
      /* 무시 */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (loading)
    return (
      <Shell>
        <p className="helper" style={{ marginTop: 40, textAlign: "center" }}>
          불러오는 중…
        </p>
      </Shell>
    );
  if (!conf) return null;

  return (
    <Shell
      steps={["선택", "의논", "완성"]}
      activeStep={2}
      cta={
        <>
          <button
            className="cta mint"
            style={{ marginBottom: 8 }}
            onClick={async () => {
              await persist(booked);
              alert(
                booked
                  ? "참석자 캘린더 등록 + 초대 발송 완료 📅 (데모)"
                  : "저장했어요. 회의실 예약은 아래에서 진행하세요."
              );
            }}
            disabled={saving}
          >
            📅 캘린더 등록 + 초대 보내기
          </button>
          <button className="cta" onClick={() => router.push("/")}>
            완료! 홈으로
          </button>
        </>
      }
    >
      <div className="confirm-hero">
        <div className="chk">✅</div>
        <h2>{slotLabel(conf.slot)} 확정</h2>
        <p>
          {conf.attendeeCount}/{conf.totalCount}명 참석 · 탭탭탭으로 마무리해요
        </p>
      </div>

      {/* 회의실 (목업) */}
      <div className="cardbox">
        <h3>📍 회의실 {booked ? "· 예약 완료" : "· 예약 필요"}</h3>
        {MEETING_ROOMS.map((r) => {
          const fits = r.cap >= (conf.attendeeCount || 0);
          const busy = r.status === "busy";
          const disabled = busy || (!fits && r.cap < 99);
          const isRec = r.id === recommendedId && !busy;
          const sel = r.id === effectiveRoomId && !disabled;
          return (
            <div
              key={r.id}
              className={`room ${sel ? "sel" : ""} ${disabled ? "busy" : ""}`}
              onClick={
                disabled
                  ? undefined
                  : () => {
                      setRoomId(r.id);
                      setBooked(false);
                    }
              }
            >
              <div className="rtop">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4>
                    {r.name}
                    {isRec && <span className="rec">추천</span>}
                  </h4>
                  <div className="cap">
                    {r.cap < 99 ? `최대 ${r.cap}인` : "인원 제한 없음"}
                    {r.floor !== "-" ? ` · ${r.floor}` : ""}
                  </div>
                </div>
                <span className={`stat ${busy ? "no" : "ok"}`}>
                  {busy ? "그 시간 사용중" : "예약 가능"}
                </span>
              </div>
              <div className="equip">
                {r.equip.map((e) => (
                  <span key={e}>{e}</span>
                ))}
                {!fits && r.cap < 99 && (
                  <span style={{ color: "#A32D2D", background: "#FCEBEB" }}>인원 초과</span>
                )}
              </div>
            </div>
          );
        })}
        <button
          className="cta mint"
          style={{ marginTop: 12, fontSize: 14, padding: 12 }}
          onClick={() => persist(true).then(() => setBooked(true))}
          disabled={saving || booked}
        >
          {booked ? "✔ 예약됨" : `${roomLabel(room)} 예약하기`}
        </button>
        <p className="addisclosure">사내 회의실 예약 시스템과 연동되는 자리예요 (지금은 목업).</p>
      </div>

      {/* 준비물 */}
      <div className="field">
        <label>📋 준비물 · 아젠다 (여러 개 선택)</label>
        <div className="chips">
          {PREP_ITEMS.map((p) => (
            <button
              key={p}
              className={`chip${prep.includes(p) ? " on" : ""}`}
              onClick={() => togglePrep(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 알림 예약 (목업) */}
      <div className="cardbox">
        <h3>🔔 알림 예약</h3>
        {ALERT_ITEMS.map((a) => {
          const on = alerts.includes(a);
          return (
            <div
              key={a}
              className={`check ${on ? "done" : ""}`}
              onClick={() => toggleAlert(a)}
            >
              <div className="box">✓</div>
              <span>{a}</span>
            </div>
          );
        })}
      </div>

      {/* 공지 */}
      <div className="cardbox">
        <h3>📢 회의 공지</h3>
        <div className="notice" style={{ whiteSpace: "pre-wrap" }}>
          {noticeText()}
        </div>
        <div className="linkbox" style={{ marginTop: 12 }}>
          <span className="u">위 공지를 단톡방에 붙여넣기</span>
          <button onClick={copyNotice}>{copied ? "복사됨!" : "복사"}</button>
        </div>
      </div>

      <p className="helper" style={{ textAlign: "center", marginTop: 4 }}>
        {title}
      </p>
    </Shell>
  );
}
