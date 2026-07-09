import { NextRequest, NextResponse } from "next/server";
import { listMembers, createMember } from "@/features/org/queries";

// GET /api/admin/members
export async function GET() {
  try {
    const members = await listMembers();
    return NextResponse.json(members);
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/admin/members
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.account?.trim() || !body.name?.trim()) {
      return NextResponse.json({ error: "account, name은 필수입니다." }, { status: 400 });
    }
    const member = await createMember({
      account: body.account.trim(),
      name: body.name.trim(),
      photo: body.photo || null,
    });
    return NextResponse.json(member, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }
}
