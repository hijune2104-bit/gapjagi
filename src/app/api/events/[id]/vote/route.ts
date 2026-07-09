// POST /api/events/[id]/vote — 투표 (같은 이름은 표 교체)
import { NextResponse } from "next/server";
import { castVote } from "@/features/event/queries";

export const runtime = "nodejs";

interface VoteBody {
  candidateId: string;
  voterName: string;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as VoteBody;

    if (!body.voterName?.trim()) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }
    if (!body.candidateId) {
      return NextResponse.json(
        { error: "후보를 선택해주세요." },
        { status: 400 }
      );
    }

    await castVote({
      eventId: id,
      candidateId: body.candidateId,
      voterName: body.voterName.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST vote]", e);
    return NextResponse.json({ error: "투표에 실패했습니다." }, { status: 500 });
  }
}
