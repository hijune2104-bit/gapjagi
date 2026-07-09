// GET /api/meetings/[id] — 회의 이벤트 + 참여자 + 응답(가능시간) + 확정 내용
import { NextResponse } from "next/server";
import { getEvent, getParticipants } from "@/features/event/queries";
import {
  getMeetingConfirmation,
  listAvailability,
} from "@/features/meeting/queries";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const event = await getEvent(id);
  if (!event || event.module_type !== "meeting") {
    return NextResponse.json(
      { error: "회의를 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  const [participants, responders, confirmation] = await Promise.all([
    getParticipants(id),
    listAvailability(id),
    getMeetingConfirmation(id),
  ]);
  return NextResponse.json({ event, participants, responders, confirmation });
}
