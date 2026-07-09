// POST /api/meetings/[id]/availability — 내 가능 시간 저장/갱신
import { NextResponse } from "next/server";
import { upsertAvailability } from "@/features/meeting/queries";

export const runtime = "nodejs";

interface Body {
  voterName: string;
  account?: string | null;
  slots: string[];
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  try {
    const body = (await req.json()) as Body;
    if (!body.voterName?.trim()) {
      return NextResponse.json({ error: "이름이 필요합니다." }, { status: 400 });
    }
    await upsertAvailability(
      id,
      body.voterName.trim(),
      body.account ?? null,
      Array.isArray(body.slots) ? body.slots : []
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/meetings/[id]/availability]", e);
    return NextResponse.json(
      { error: "가능 시간 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
