// GET /api/events/[id]/results — 후보별 득표 집계 (2차 결과 화면 폴링)
import { NextResponse } from "next/server";
import { getTallies, getVoterCount } from "@/features/event/queries";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const [tallies, voterCount] = await Promise.all([
    getTallies(id),
    getVoterCount(id),
  ]);
  return NextResponse.json({ tallies, voterCount });
}
