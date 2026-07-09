import { NextRequest, NextResponse } from "next/server";
import {
  getEvent,
  getCandidates,
  getParticipants,
  getTallies,
  getLatestPlan,
  updateEventStatus,
  deleteEvent,
} from "@/features/event/queries";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/events/:id — 이벤트 상세 + 후보 + 참여자 + 투표 + 플랜
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const event = await getEvent(id);
    if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });
    const [candidates, participants, tallies, plan] = await Promise.all([
      getCandidates(id),
      getParticipants(id),
      getTallies(id),
      getLatestPlan(id),
    ]);
    return NextResponse.json({ event, candidates, participants, tallies, plan });
  } catch {
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }
}

// PUT /api/admin/events/:id — 상태 변경
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    if (body.status) {
      const updated = await updateEventStatus(id, body.status);
      if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: "변경할 필드가 없습니다." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }
}

// DELETE /api/admin/events/:id
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const ok = await deleteEvent(id);
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }
}
