// GET /api/org/members — 동기화된 멤버 목록 (로그인 화면 선택/검색용).
// 비어 있으면 자동으로 1회 동기화 후 반환 (데모 편의).
import { NextResponse } from "next/server";
import { countMembers, listMembers } from "@/features/org/queries";
import { syncMembers } from "@/features/org/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    if ((await countMembers()) === 0) {
      await syncMembers(); // 최초 진입 시 자동 동기화 (샘플 폴백 포함)
    }
    const members = await listMembers();
    return NextResponse.json({ members });
  } catch (e) {
    console.error("[GET /api/org/members]", e);
    return NextResponse.json(
      { error: "멤버 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
