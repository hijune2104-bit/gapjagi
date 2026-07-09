// GET /api/org/members/[account] — 아이디(account)로 멤버 조회 (로그인 검증용).
// POST — DB에 없는 아이디를 이름과 함께 새 멤버로 등록(간이 회원가입).
import { NextResponse } from "next/server";
import { getMember, upsertMembers } from "@/features/org/queries";

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

// POST /api/org/members/[account] — 아이디가 없을 때 이름과 함께 새 멤버 등록.
export async function POST(
  req: Request,
  ctx: { params: Promise<{ account: string }> }
) {
  const { account } = await ctx.params;
  const value = decodeURIComponent(account ?? "").trim();
  if (!value) {
    return NextResponse.json({ error: "아이디를 입력해주세요." }, { status: 400 });
  }
  let name = "";
  try {
    const body = (await req.json()) as { name?: string };
    name = body.name?.trim() ?? "";
  } catch {
    /* 본문 없음 */
  }
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  // 프로필 사진은 없으므로 null → Avatar 가 이름 이니셜로 대체.
  await upsertMembers([{ account: value, name, photo: null }]);
  const member = await getMember(value);
  return NextResponse.json({ member }, { status: 201 });
}
