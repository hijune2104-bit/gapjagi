// POST /api/meetings/[id]/confirm — 회의 시간(+회의실/준비물) 확정 저장
import { NextResponse } from "next/server";
import { saveMeetingConfirmation } from "@/features/meeting/queries";
import type { MeetingConfirmation } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as Partial<MeetingConfirmation>;
    if (!body.slot) {
      return NextResponse.json(
        { error: "확정할 시간이 필요합니다." },
        { status: 400 }
      );
    }
    const confirmation: MeetingConfirmation = {
      kind: "meeting",
      slot: body.slot,
      attendeeCount: body.attendeeCount ?? 0,
      totalCount: body.totalCount ?? 0,
      excluded: body.excluded ?? [],
      roomId: body.roomId ?? null,
      roomName: body.roomName ?? null,
      roomBooked: body.roomBooked ?? false,
      prep: body.prep ?? [],
    };
    await saveMeetingConfirmation(id, confirmation);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/meetings/[id]/confirm]", e);
    return NextResponse.json(
      { error: "확정 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
