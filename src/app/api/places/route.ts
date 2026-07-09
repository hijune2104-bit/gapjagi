// GET /api/places?region=강남역&moods=고깃집,왁자지껄
// 지역 + 분위기로 Kakao Local 식당 검색 결과를 반환합니다.
import { NextResponse } from "next/server";
import { searchPlaces } from "@/features/place/kakao";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = (searchParams.get("region") ?? "").trim();
  const x = (searchParams.get("x") ?? "").trim(); // 경도(lng)
  const y = (searchParams.get("y") ?? "").trim(); // 위도(lat)
  const moods = (searchParams.get("moods") ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const hasCoords = Boolean(x && y);
  if (!region && !hasCoords) {
    return NextResponse.json(
      { error: "지역을 입력하거나 내 위치를 사용해주세요." },
      { status: 400 }
    );
  }

  try {
    const places = await searchPlaces({
      region,
      moods,
      size: 10,
      x: hasCoords ? x : undefined,
      y: hasCoords ? y : undefined,
    });
    return NextResponse.json({ places });
  } catch (e) {
    console.error("[GET /api/places]", e);
    const msg =
      e instanceof Error && e.message.includes("KAKAO_REST_API_KEY")
        ? "검색 키가 설정되지 않았습니다. (.env.local 확인)"
        : "식당 검색에 실패했습니다.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
