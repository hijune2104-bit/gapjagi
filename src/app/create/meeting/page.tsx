"use client";

// 갑자기 회의 설정 (M-01·M-02) — 내 가능 시간 칠하기 + 참여자 지정 → 링크 발급.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import MemberPicker from "@/features/org/MemberPicker";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import { PaintGrid } from "@/features/meeting/MeetingGrid";
import { DEFAULT_MEETING_CONFIG } from "@/features/meeting/constants";
import type { Participant } from "@/lib/types";

export default function CreateMeetingPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const cfg = DEFAULT_MEETING_CONFIG;

  const [title, setTitle] = useState("주간 팀 회의");
  const [slots, setSlots] = useState<string[]>([]);
  const [guestName, setGuestName] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 주최자 본인을 참여자에 자동 포함
  useEffect(() => {
    if (user?.account) {
      setParticipants((prev) =>
        prev.some((p) => p.account === user.account)
          ? prev
          : [{ account: user.account, name: user.name, photo: user.photo ?? null }, ...prev]
      );
    }
  }, [user]);

  const myName = user?.name ?? guestName.trim();
  const canSubmit = Boolean(myName) && slots.length > 0 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "갑자기 회의",
          config: cfg,
          participants,
          creator: { voterName: myName, account: user?.account ?? null, slots },
        }),
      });
      if (!res.ok) throw new Error();
      const { eventId } = await res.json();
      router.push(`/m/${eventId}`);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <Shell
      steps={["선택", "의논", "완성"]}
      activeStep={0}
      cta={
        <button className="cta" onClick={submit} disabled={!canSubmit}>
          {submitting
            ? "만드는 중…"
            : slots.length === 0
              ? "가능한 시간을 칠해주세요"
              : "회의 링크 만들기"}
        </button>
      }
    >
      <div className="qline">
        <span className="dot" />
        먼저 내 가능한 시간을 칠해주세요
      </div>
      <h1 className="title" style={{ fontSize: 22 }}>
        언제 다들 돼요?
      </h1>

      <div className="field">
        <label>회의 이름</label>
        <input
          className="tinput"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 주간 팀 회의"
        />
      </div>

      {!user && (
        <div className="field">
          <label>내 이름</label>
          <input
            className="tinput"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="예: 윤슬기"
          />
        </div>
      )}

      <div className="field">
        <label>내 가능 시간 (탭 또는 드래그)</label>
        <p className="helper" style={{ marginBottom: 10 }}>
          되는 칸을 칠하세요. 다음 단계에서 팀원에게 보낼 링크를 만들어요.
        </p>
        <PaintGrid config={cfg} value={slots} onChange={setSlots} />
      </div>

      <div className="field">
        <label>참여자 ({participants.length}명)</label>
        <MemberPicker value={participants} onChange={setParticipants} />
      </div>
    </Shell>
  );
}
