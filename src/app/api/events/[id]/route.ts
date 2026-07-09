// GET /api/events/[id] — 이벤트 + 후보 목록
import { NextResponse } from "next/server";
import { getCandidates, getEvent } from "@/features/event/queries";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const event = await getEvent(id);
  if (!event) {
    return NextResponse.json(
      { error: "이벤트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  const candidates = await getCandidates(id);
  return NextResponse.json({ event, candidates });
}
