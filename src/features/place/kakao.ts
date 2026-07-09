// Kakao Local API 연동 (서버 전용). 지역 + 분위기로 식당을 검색합니다.
// 문서: https://developers.kakao.com/docs/latest/ko/local/dev-guide
import type { PlaceResult } from "@/lib/types";

const KAKAO_ENDPOINT = "https://dapi.kakao.com/v2/local/search/keyword.json";

// 분위기 태그 → 검색 키워드 매핑. (칩 라벨을 실제 검색어로 변환)
const MOOD_KEYWORD: Record<string, string> = {
  고깃집: "고기집",
  "술 한잔": "술집",
  "조용한 곳": "조용한 맛집",
  왁자기껄: "맛집",
  왁자지껄: "맛집",
  "분위기 좋은": "분위기 좋은 맛집",
  가성비: "가성비 맛집",
  "회 / 해산물": "횟집",
  이색적인: "맛집",
};

// 지역 + 분위기로 검색어를 구성합니다.
export function buildQuery(region: string, moods: string[]): string {
  const keyword =
    moods.map((m) => MOOD_KEYWORD[m]).find(Boolean) ?? "맛집";
  return `${region} ${keyword}`.trim();
}

interface KakaoDoc {
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  place_url: string;
  distance?: string;
  x: string; // 경도(lng)
  y: string; // 위도(lat)
}

export async function searchPlaces(input: {
  region?: string;
  moods: string[];
  size?: number;
  x?: string; // 경도(lng) — 내 위치 기반 검색 시
  y?: string; // 위도(lat)
  radius?: number; // 반경(m), 좌표 검색 시. 기본 1500m
}): Promise<PlaceResult[]> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error("KAKAO_REST_API_KEY 가 설정되지 않았습니다 (.env.local 확인).");
  }

  const hasCoords = Boolean(input.x && input.y);
  // 좌표 검색이면 지역명 없이 분위기 키워드만, 지역 검색이면 지역+키워드.
  const query = hasCoords
    ? buildQuery("", input.moods)
    : buildQuery(input.region ?? "", input.moods);

  const url = new URL(KAKAO_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("category_group_code", "FD6"); // FD6 = 음식점
  url.searchParams.set("size", String(input.size ?? 10));

  if (hasCoords) {
    // 좌표 중심 + 반경 + 거리순 → '내 주변' 추천
    url.searchParams.set("x", input.x!);
    url.searchParams.set("y", input.y!);
    url.searchParams.set("radius", String(input.radius ?? 1500));
    url.searchParams.set("sort", "distance");
  } else {
    url.searchParams.set("sort", "accuracy");
  }

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Kakao API 오류 ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { documents: KakaoDoc[] };
  return (data.documents ?? []).map((d) => ({
    name: d.place_name,
    // "음식점 > 한식 > 육류,고기" → 마지막 조각만 노출
    category: d.category_name?.split(" > ").pop() ?? "음식점",
    address: d.road_address_name || d.address_name || "",
    phone: d.phone || "",
    placeUrl: d.place_url || "",
    distance: d.distance,
    lat: Number(d.y), // 카카오는 y=위도, x=경도
    lng: Number(d.x),
  }));
}
