// GET /api/org/members/[account] — 아이디(account)로 멤버 조회 (로그인 검증용).
import { NextResponse } from "next/server";
import { getMember } from "@/features/org/queries";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ account: string }> }
) {
  const { account } = await ctx.params;
  const value = decodeURIComponent(account ?? "").trim();
  if (!value) {
    return NextResponse.json({ error: "아이디를 입력해주세요." }, { status: 400 });
  }
  const member = await getMember(value);
  if (!member) {
    return NextResponse.json(
      { error: "해당 아이디의 사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  return NextResponse.json({ member });
}
