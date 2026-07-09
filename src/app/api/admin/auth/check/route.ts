// GET /api/admin/auth/check — 쿠키 기반 인증 확인
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("admin_auth");
  if (cookie?.value === "1") {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
