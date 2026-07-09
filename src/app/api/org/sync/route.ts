// POST /api/org/sync — 조직도 API를 호출해 members(이름·아이디)를 로컬에 동기화.
// 크레덴셜(env)이 없으면 샘플 데이터로 폴백 (source: "sample").
import { NextResponse } from "next/server";
import { syncMembers } from "@/features/org/client";

export const runtime = "nodejs";
export const maxDuration = 60; // 조직도 응답이 크므로 여유

export async function POST() {
  try {
    const result = await syncMembers();
    return NextResponse.json(result);
  } catch (e) {
    console.error("[POST /api/org/sync]", e);
    return NextResponse.json(
      { error: "조직도 동기화에 실패했습니다." },
      { status: 500 }
    );
  }
}
