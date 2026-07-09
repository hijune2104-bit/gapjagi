// Groq 연동 (서버 전용). 투표 결과 → 회식 실행 문서(PlanContent) 생성.
import Groq from "groq-sdk";
import type { DinnerConfig, PlanContent, TallyItem } from "@/lib/types";

export const GROQ_MODEL = "openai/gpt-oss-120b";
const MODEL = GROQ_MODEL;

// 지연 초기화: 모듈 로드 시점에 키가 없어도 앱이 죽지 않게 함수 안에서 생성.
// (붙여넣기 파서 등 다른 기능에서도 재사용)
export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY 가 설정되지 않았습니다 (.env.local 확인).");
  }
  return new Groq({ apiKey });
}
const getClient = getGroqClient;

// AI에게 넘길 입력 요약 + 원하는 출력(JSON) 스키마를 프롬프트로 지시합니다.
function buildPrompt(input: {
  title: string;
  config: DinnerConfig;
  winner: TallyItem;
  tallies: TallyItem[];
  voterCount: number;
}): { system: string; user: string } {
  const { title, config, winner, tallies, voterCount } = input;

  const system = [
    "너는 한국 직장인의 '갑자기 잡힌 회식'을 매끄럽게 실행하도록 돕는 기획자야.",
    "투표 결과를 받아서, 단톡방에 바로 붙여넣을 수 있는 실행 문서를 만든다.",
    "말투는 친근하고 간결한 한국어. 과장 없이 실용적으로.",
    "반드시 아래 JSON 스키마에 '정확히' 맞는 JSON만 출력해. 설명 문장이나 코드블록 없이 순수 JSON.",
    `{
  "announcement": "단톡방 공지문 (이모지 약간 포함, 3~5문장)",
  "timeline": [{"time":"19:00","activity":"..."}],
  "checklist": ["예약 전화하기", "..."],
  "feeSplit": {"perPerson": 30000, "total": 300000, "note": "계산 근거 한 줄"},
  "reservation": {"place": "확정 식당명", "tip": "예약 팁 한 줄"}
}`,
  ].join("\n");

  const rank = tallies
    .slice()
    .sort((a, b) => b.votes - a.votes)
    .map((t, i) => `${i + 1}위 ${t.candidate.name} (${t.votes}표)`)
    .join(", ");

  const budgetTotalHint = config.headcount
    ? `참석 ${config.headcount}명 기준 1인 예산대는 '${config.budget}'.`
    : `1인 예산대는 '${config.budget}'.`;

  const user = [
    `회식 제목: ${title}`,
    `분위기 태그: ${config.moods.join(", ") || "무관"}`,
    budgetTotalHint,
    config.memo ? `주최자 메모: ${config.memo}` : "",
    `투표 참여 인원: ${voterCount}명`,
    `투표 순위: ${rank}`,
    `확정 식당: ${winner.candidate.name}` +
      (winner.candidate.meta?.area ? ` (${winner.candidate.meta.area})` : "") +
      (winner.candidate.meta?.priceRange
        ? ` / 가격대 ${winner.candidate.meta.priceRange}`
        : "") +
      (winner.candidate.meta?.note ? ` / ${winner.candidate.meta.note}` : ""),
    "",
    "위 정보를 바탕으로 실행 문서 JSON을 만들어줘. feeSplit.perPerson 과 total 은 원 단위 정수로.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

// 안전한 기본값 — 파싱 실패 시 최소한의 문서라도 반환하기 위함.
function fallbackPlan(winner: TallyItem, voterCount: number): PlanContent {
  return {
    announcement: `📢 회식 장소가 '${winner.candidate.name}'(으)로 정해졌어요! 시간 맞춰서 모여주세요 🙌`,
    timeline: [
      { time: "19:00", activity: `${winner.candidate.name} 집결 및 시작` },
      { time: "21:00", activity: "마무리 / 2차 자유" },
    ],
    checklist: [
      `${winner.candidate.name} 예약 전화`,
      "참석 인원 최종 확인",
      "회비 정산 방법 공지",
    ],
    feeSplit: { perPerson: 0, total: 0, note: "예산대 기준 추후 정산" },
    reservation: {
      place: winner.candidate.name,
      tip: "예약 시 인원과 도착 시간을 함께 알려주세요.",
    },
  };
}

export async function generateDinnerPlan(input: {
  title: string;
  config: DinnerConfig;
  winner: TallyItem;
  tallies: TallyItem[];
  voterCount: number;
}): Promise<PlanContent> {
  const client = getClient();
  const { system, user } = buildPrompt(input);

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(raw) as PlanContent;
    // 최소 필드 검증
    if (!parsed.announcement || !parsed.reservation?.place) {
      return fallbackPlan(input.winner, input.voterCount);
    }
    return parsed;
  } catch {
    return fallbackPlan(input.winner, input.voterCount);
  }
}
