// 붙여넣기 매직 (서버 전용) — 단톡방 자유 대화 → 회식 설정 필드 파싱.
// 값은 반드시 설정 화면의 보기(칩) 중 하나로 제한(환각 방지).
import { getGroqClient, GROQ_MODEL } from "@/features/plan/groq";
import {
  BUDGETS,
  FOODS,
  PEOPLE,
  REGIONS,
  VIBES,
} from "@/features/event/dinnerOptions";

export interface ParsedDinner {
  people: string | null; // PEOPLE 중 하나
  budget: string | null; // BUDGETS 중 하나
  food: string | null; // FOODS 중 하나
  vibe: string | null; // VIBES 중 하나
  region: string | null; // REGIONS 중 하나
  dateOffset: number | null; // dates 보기의 인덱스 (0부터)
  memo: string; // 대화에서 드러난 특이사항 한 줄
}

export async function parseDinnerText(input: {
  text: string;
  dates: string[]; // 날짜 칩 라벨 (예: ["오늘(목)","내일(금)",...])
}): Promise<ParsedDinner> {
  const client = getGroqClient();

  const system = [
    "너는 한국 직장인의 단톡방 대화에서 '회식 계획 정보'를 뽑아내는 파서야.",
    "붙여넣은 자유로운 대화 텍스트를 읽고 아래 필드를 추출해서 JSON만 출력해.",
    "각 값은 반드시 주어진 보기 중 하나와 '완전히 동일한 문자열'이어야 해. 확실하지 않으면 null.",
    "설명 문장이나 코드블록 없이 순수 JSON만.",
    "",
    `- people (인원): ${PEOPLE.join(" | ")}`,
    `- budget (1인 예산): ${BUDGETS.join(" | ")}`,
    `- food (메뉴): ${FOODS.join(" | ")}`,
    `- vibe (분위기): ${VIBES.join(" | ")}`,
    `- region (권역): ${REGIONS.join(" | ")}  (대화에 나온 지역과 가장 가까운 권역 선택)`,
    `- dateOffset: 회식 날짜에 가장 맞는 보기의 인덱스(정수). 언급 없으면 null.`,
    `  날짜 보기 → ${input.dates.map((d, i) => `${i}:${d}`).join("  ")}`,
    `- memo: 대화에서 드러난 특이사항 한 줄(예: "부장님 참석", "회식비 법인카드"). 없으면 "".`,
    "",
    `출력 형식: {"people":null,"budget":null,"food":null,"vibe":null,"region":null,"dateOffset":null,"memo":""}`,
  ].join("\n");

  const user = `다음 대화에서 회식 정보를 뽑아줘:\n"""\n${input.text}\n"""`;

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let p: Record<string, unknown> = {};
  try {
    p = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    /* 파싱 실패 시 전부 null */
  }

  // 보기에 없는 값은 버린다 (LLM 환각 방지)
  const pick = (v: unknown, opts: string[]) =>
    typeof v === "string" && opts.includes(v) ? v : null;
  const rawOffset = p.dateOffset;
  const dateOffset =
    typeof rawOffset === "number" &&
    Number.isInteger(rawOffset) &&
    rawOffset >= 0 &&
    rawOffset < input.dates.length
      ? rawOffset
      : null;

  return {
    people: pick(p.people, PEOPLE),
    budget: pick(p.budget, BUDGETS),
    food: pick(p.food, FOODS),
    vibe: pick(p.vibe, VIBES),
    region: pick(p.region, REGIONS),
    dateOffset,
    memo: typeof p.memo === "string" ? p.memo.slice(0, 100) : "",
  };
}
