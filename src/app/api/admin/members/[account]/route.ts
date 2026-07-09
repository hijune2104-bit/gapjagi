import { NextRequest, NextResponse } from "next/server";
import { getMember, updateMember, deleteMember } from "@/features/org/queries";

type Ctx = { params: Promise<{ account: string }> };

// GET /api/admin/members/:account
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { account } = await ctx.params;
    const member = await getMember(account);
    if (!member) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(member);
  } catch {
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }
}

// PUT /api/admin/members/:account
export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { account } = await ctx.params;
    const body = await req.json();
    const updated = await updateMember(account, body);
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }
}

// DELETE /api/admin/members/:account
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { account } = await ctx.params;
    const ok = await deleteMember(account);
    if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }
}
