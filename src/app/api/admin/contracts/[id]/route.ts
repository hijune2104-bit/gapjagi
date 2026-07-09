import { NextRequest, NextResponse } from "next/server";
import {
  getContract,
  updateContract,
  deleteContract,
} from "@/features/ad/queries";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/contracts/:id
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const contract = await getContract(id);
  if (!contract) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(contract);
}

// PUT /api/admin/contracts/:id
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json();
  const updated = await updateContract(id, body);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/admin/contracts/:id
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const ok = await deleteContract(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
