// POST /api/events/[id]/join — 링크로 들어온 로그인 사용자를 참여자로 추가.
import { NextResponse } from "next/server";
import { addParticipants } from "@/features/event/queries";
import type { Participant } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Partial<Participant>;
    if (!body.account?.trim() || !body.name?.trim()) {
      return NextResponse.json(
        { error: "로그인 후 참여할 수 있습니다." },
        { status: 400 }
      );
    }
    await addParticipants(id, [
      {
        account: body.account.trim(),
        name: body.name.trim(),
        photo: body.photo ?? null,
      },
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST join]", e);
    return NextResponse.json({ error: "참여에 실패했습니다." }, { status: 500 });
  }
}
