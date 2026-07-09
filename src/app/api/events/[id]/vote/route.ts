// POST /api/events/[id]/vote — 투표 (복수 선택 가능, 같은 이름은 표 통째로 교체)
import { NextResponse } from "next/server";
import { castVotes } from "@/features/event/queries";

export const runtime = "nodejs";

interface VoteBody {
  candidateIds?: string[]; // 복수 선택
  candidateId?: string; // 하위호환 (단일)
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
    const candidateIds = (
      body.candidateIds ?? (body.candidateId ? [body.candidateId] : [])
    ).filter(Boolean);
    if (candidateIds.length === 0) {
      return NextResponse.json(
        { error: "후보를 하나 이상 선택해주세요." },
        { status: 400 }
      );
    }

    await castVotes({
      eventId: id,
      candidateIds,
      voterName: body.voterName.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST vote]", e);
    return NextResponse.json({ error: "투표에 실패했습니다." }, { status: 500 });
  }
}
