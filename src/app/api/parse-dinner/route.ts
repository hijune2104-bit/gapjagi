// POST /api/parse-dinner — 붙여넣은 단톡방 대화 → 회식 설정 필드 파싱 (붙여넣기 매직).
import { NextResponse } from "next/server";
import { parseDinnerText } from "@/features/plan/parseDinner";

export const runtime = "nodejs";

interface Body {
  text: string;
  dates?: string[]; // 날짜 칩 라벨 (클라 로컬 기준)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.text?.trim()) {
      return NextResponse.json(
        { error: "붙여넣을 대화 내용이 필요합니다." },
        { status: 400 }
      );
    }
    const parsed = await parseDinnerText({
      text: body.text.trim(),
      dates: Array.isArray(body.dates) ? body.dates : [],
    });
    return NextResponse.json({ parsed });
  } catch (e) {
    console.error("[POST /api/parse-dinner]", e);
    return NextResponse.json(
      { error: "대화를 분석하지 못했습니다." },
      { status: 500 }
    );
  }
}
