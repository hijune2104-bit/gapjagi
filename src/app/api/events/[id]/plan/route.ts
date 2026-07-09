// GET  /api/events/[id]/plan — 저장된 최신 추천안 조회
// POST /api/events/[id]/plan — 투표 결과로 추천안 생성(Groq) 후 저장
import { NextResponse } from "next/server";
import { generateDinnerPlan } from "@/features/plan/groq";
import {
  getEvent,
  getLatestPlan,
  getTallies,
  getVoterCount,
  savePlan,
} from "@/features/event/queries";
import type { DinnerConfig } from "@/lib/types";

export const runtime = "nodejs";
// Groq 호출이 몇 초 걸릴 수 있어 여유를 둡니다.
export const maxDuration = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const plan = await getLatestPlan(id);
  if (!plan) {
    return NextResponse.json({ plan: null }, { status: 200 });
  }
  return NextResponse.json({ plan });
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    const event = await getEvent(id);
    if (!event) {
      return NextResponse.json(
        { error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const [tallies, voterCount] = await Promise.all([
      getTallies(id),
      getVoterCount(id),
    ]);

    if (tallies.length === 0) {
      return NextResponse.json(
        { error: "후보가 없습니다." },
        { status: 400 }
      );
    }

    // 최다 득표 후보를 확정. 동점이면 먼저 등록된 후보 우선.
    const winner = tallies.reduce((best, cur) =>
      cur.votes > best.votes ? cur : best
    );

    const content = await generateDinnerPlan({
      title: event.title,
      config: event.config as DinnerConfig,
      winner,
      tallies,
      voterCount,
    });

    // 확정 장소는 AI 표현 대신 실제 후보 데이터로 덮어써 정확도를 보장 (캘린더 장소로 사용).
    content.reservation = {
      ...content.reservation,
      place: winner.candidate.name,
      address: winner.candidate.meta?.address,
      placeUrl: winner.candidate.meta?.placeUrl,
      lat: winner.candidate.meta?.lat,
      lng: winner.candidate.meta?.lng,
    };

    const plan = await savePlan(id, content);
    return NextResponse.json({ plan }, { status: 201 });
  } catch (e) {
    console.error("[POST plan]", e);
    return NextResponse.json(
      { error: "추천안 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
