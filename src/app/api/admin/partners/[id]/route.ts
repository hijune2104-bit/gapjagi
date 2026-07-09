import { NextRequest, NextResponse } from "next/server";
import { getPartner, updatePartner, deletePartner } from "@/features/ad/queries";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/partners/:id
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const partner = await getPartner(id);
  if (!partner) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(partner);
}

// PUT /api/admin/partners/:id
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const updated = await updatePartner(id, body);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/admin/partners/:id
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const ok = await deletePartner(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
