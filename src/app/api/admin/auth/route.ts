// POST /api/admin/auth — Admin 비밀번호 검증
import { NextRequest, NextResponse } from "next/server";

const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "admin1234";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password === ADMIN_PW) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_auth", "1", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 24시간
      sameSite: "lax",
    });
    return res;
  }
  return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_auth");
  return res;
}
