// 갑자기(Gapjagi) 공용 타입.
// DB 컬럼과 1:1로 맞추되, 클라이언트/서버가 함께 쓰는 형태로 정의합니다.

export type ModuleType = "dinner" | "trip" | "workshop";
export type EventStatus = "voting" | "closed" | "done";

// 회식 모듈의 설정값 (events.config 에 jsonb 로 저장).
// headcount: 참석 인원 수, budget: 1인 예산대, mood: 회식 분위기 태그들.
export interface DinnerConfig {
  headcount: number;
  budget: string; // 예: "3만원 이하" | "3~5만원" | "5만원 이상"
  moods: string[]; // 예: ["고깃집", "왁자지껄"]
  memo?: string; // 주최자 자유 메모
  scheduledAt?: string; // 회식 일시 (datetime-local 문자열, 예: "2026-07-10T19:00"). 캘린더 등록에 사용.
}

export interface EventRow {
  id: string;
  module_type: ModuleType;
  title: string;
  config: DinnerConfig | Record<string, unknown>;
  status: EventStatus;
  created_at: string;
}

// 후보 식당의 부가정보 (candidates.meta 에 jsonb 로 저장).
export interface CandidateMeta {
  area?: string; // 위치/동네
  priceRange?: string; // 가격대
  note?: string; // 한 줄 특징
  // --- Kakao Local 검색으로 담은 경우 채워지는 값들 ---
  category?: string; // 카카오 카테고리 (예: "음식점 > 한식 > 육류,고기")
  address?: string; // 도로명/지번 주소
  phone?: string; // 전화번호
  placeUrl?: string; // 카카오맵 상세페이지 (리뷰/후기 확인용 링크)
  lat?: number; // 위도 (지도 표시용)
  lng?: number; // 경도
  tags?: string[]; // 주최자 메모 태그 (D-05, 투표 시 노출)
  ad?: boolean; // 제휴(광고) 후보 여부 (D-12)
}

// Kakao Local 검색 결과 1건 (클라이언트로 넘기는 정규화된 형태).
export interface PlaceResult {
  name: string;
  category: string;
  address: string;
  phone: string;
  placeUrl: string;
  distance?: string;
  lat: number; // 위도
  lng: number; // 경도
}

export interface CandidateRow {
  id: string;
  event_id: string;
  name: string;
  meta: CandidateMeta;
  created_at: string;
}

export interface VoteRow {
  id: string;
  event_id: string;
  candidate_id: string;
  voter_name: string;
  created_at: string;
}

// 이벤트 참여자 (조직도 사용자). 생성 시 지정하거나 링크로 합류.
export interface Participant {
  account: string;
  name: string;
  photo: string | null;
}

// 투표자 1명 (이름 + 프로필 사진).
export interface Voter {
  name: string;
  photo: string | null;
}

// 후보별 득표 집계 (2차 결과 화면용).
export interface TallyItem {
  candidate: CandidateRow;
  votes: number;
  voters: Voter[];
}

// Groq 가 생성하는 실행 문서 (plans.content 에 jsonb 로 저장).
export interface PlanContent {
  announcement: string; // 단톡방에 그대로 붙여넣는 공지문
  timeline: { time: string; activity: string }[]; // 당일 타임라인
  checklist: string[]; // 예약/준비 체크리스트
  feeSplit: {
    perPerson: number; // 1인 분담금(원)
    total: number; // 총액(원)
    note: string; // 계산 근거 한 줄
  };
  reservation: {
    place: string; // 확정된 식당명
    tip: string; // 예약 팁 한 줄
    address?: string; // 확정 식당 주소 (캘린더 장소용, 서버가 후보 meta에서 채움)
    placeUrl?: string; // 카카오맵 상세 링크
    lat?: number; // 위도 (지도 표시용)
    lng?: number; // 경도
  };
}

export interface PlanRow {
  id: string;
  event_id: string;
  content: PlanContent;
  generated_at: string;
}

// ── 광고 파트너 ──

export type AdPartnerCategory = "restaurant" | "travel" | "venue";
export type AdPartnerStatus = "pending" | "approved" | "rejected" | "paused";

export interface AdPartnerRow {
  id: string;
  business_name: string;
  category: AdPartnerCategory;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  description: string | null;
  address: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  place_url: string | null;
  photo_url: string | null;
  status: AdPartnerStatus;
  created_at: string;
}

// ── 광고 계약 ──

export type AdPlanType = "basic" | "premium" | "vip";
export type AdContractStatus = "active" | "paused" | "expired" | "cancelled";

export interface AdContractRow {
  id: string;
  partner_id: string;
  module_type: ModuleType;
  plan_type: AdPlanType;
  monthly_fee: number;
  start_date: string;
  end_date: string;
  priority: number;
  status: AdContractStatus;
  memo: string | null;
  created_at: string;
}

export interface AdContractWithPartner extends AdContractRow {
  business_name: string;
  category: AdPartnerCategory;
}
