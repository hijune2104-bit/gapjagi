// GET /api/events/mine?account=... — 내가 참여자로 등록된 이벤트 목록 (홈 "내 참여 목록").
import { NextRequest, NextResponse } from "next/server";
import { listEventsByAccount } from "@/features/event/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account")?.trim();
  if (!account) return NextResponse.json({ events: [] });
  try {
    const events = await listEventsByAccount(account);
    return NextResponse.json({ events });
  } catch (e) {
    console.error("[GET /api/events/mine]", e);
    return NextResponse.json(
      { error: "참여 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
