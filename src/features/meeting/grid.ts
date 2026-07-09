// 회의 그리드 집계/분석 (순수 함수, 클라·서버 공용).
import type { MeetingConfig, MeetingResponder } from "@/lib/types";

// "수-14" → { day:"수", hour:14 }
export function parseSlot(slot: string): { day: string; hour: number } {
  const idx = slot.lastIndexOf("-");
  return { day: slot.slice(0, idx), hour: Number(slot.slice(idx + 1)) };
}

// 사람이 읽는 표기: "다음 주 수요일 14:00"
export function slotLabel(slot: string, weekLabel = "다음 주"): string {
  const { day, hour } = parseSlot(slot);
  return `${weekLabel} ${day}요일 ${hour}:00`;
}

export function allSlotKeys(cfg: MeetingConfig): string[] {
  const keys: string[] = [];
  for (const h of cfg.hours) for (const d of cfg.days) keys.push(`${d}-${h}`);
  return keys;
}

// 각 슬롯별 가능 인원 수
export function scoreSlots(
  cfg: MeetingConfig,
  responders: MeetingResponder[]
): Record<string, number> {
  const sc: Record<string, number> = {};
  for (const key of allSlotKeys(cfg)) {
    sc[key] = responders.filter((r) => r.slots.includes(key)).length;
  }
  return sc;
}

export interface MeetingAnalysis {
  scores: Record<string, number>;
  ranked: [string, number][]; // 득표 내림차순
  best: string;
  bestCount: number;
  maxScore: number;
  total: number; // 응답자 수
  missingBest: MeetingResponder[]; // 최적 시간에 못 오는 사람
  blocker: MeetingResponder | null; // 상위 3개 시간 전부 불참하는 사람(주최자 제외)
  allSlot: string | null; // 전원 가능한 시간(있으면)
}

// 최적 시간·갈등(blocker)·전원가능 여부까지 한 번에 계산.
// viewerName: 현재 사용자(주최자) — blocker 후보에서 제외.
export function analyzeMeeting(
  cfg: MeetingConfig,
  responders: MeetingResponder[],
  viewerName?: string
): MeetingAnalysis {
  const total = responders.length;
  const scores = scoreSlots(cfg, responders);
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [best, bestCount] = ranked[0] ?? ["", 0];
  const maxScore = Math.max(...Object.values(scores), 1);
  const top3 = ranked.slice(0, 3).map((r) => r[0]);
  const missingBest = responders.filter((r) => !r.slots.includes(best));
  const blocker =
    responders
      .map((r) => ({ r, hits: top3.filter((k) => r.slots.includes(k)).length }))
      .filter((x) => x.hits === 0 && x.r.voter_name !== viewerName)
      .sort((a, b) => a.hits - b.hits)[0]?.r ?? null;
  const allSlot =
    total > 0 ? (ranked.find((r) => r[1] === total)?.[0] ?? null) : null;
  return {
    scores,
    ranked,
    best,
    bestCount,
    maxScore,
    total,
    missingBest,
    blocker,
    allSlot,
  };
}
