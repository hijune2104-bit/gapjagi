// 회의 모듈 상수 (gapjagi.html 이식). 그리드 기본값 + 회의실/준비물/알림 목업.
import type { MeetingConfig } from "@/lib/types";

export const DAYS = ["월", "화", "수", "목", "금"];
export const HOURS = [10, 11, 12, 13, 14, 15, 16, 17];

export const DEFAULT_MEETING_CONFIG: MeetingConfig = {
  days: DAYS,
  hours: HOURS,
  weekLabel: "다음 주",
};

// 응답자 아바타 색상 팔레트 (이름 순서대로 부여)
export const RESPONDER_COLORS = [
  "#1A1A1E",
  "#FF5A32",
  "#3B82F6",
  "#06B981",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#14B8A6",
];

export interface MeetingRoom {
  id: string;
  name: string;
  cap: number; // 수용 인원 (99=제한없음)
  floor: string;
  equip: string[];
  status: "ok" | "busy"; // 그 시간대 예약 가능 여부 (목업)
}

// 사내 회의실 목업 (실서비스에선 예약 시스템 연동 자리)
export const MEETING_ROOMS: MeetingRoom[] = [
  { id: "A", name: "회의실 A", cap: 8, floor: "3층", equip: ["프로젝터", "화상", "화이트보드"], status: "ok" },
  { id: "B", name: "회의실 B", cap: 4, floor: "3층", equip: ["모니터", "화이트보드"], status: "ok" },
  { id: "C", name: "대회의실", cap: 20, floor: "5층", equip: ["프로젝터", "화상", "마이크"], status: "busy" },
  { id: "O", name: "온라인 (화상)", cap: 99, floor: "-", equip: ["Google Meet 링크"], status: "ok" },
];

export const PREP_ITEMS = ["노트북 지참", "자료 사전 공유", "다과 준비", "화상 링크", "프로젝터 예약"];
export const ALERT_ITEMS = ["확정 즉시 발송", "3일 전 리마인드", "당일 아침 9시", "시작 2~3시간 전"];

export function roomLabel(r: MeetingRoom | null | undefined): string {
  if (!r) return "미선택";
  return `${r.name}${r.cap < 99 ? ` (${r.cap}인)` : ""}`;
}
