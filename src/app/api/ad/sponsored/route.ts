// GET /api/ad/sponsored?module_type=dinner&region=성수
// 활성 광고 계약이 있는 파트너를 우선순위 순으로 반환
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface SponsoredPlace {
  name: string;
  category: string;
  address: string;
  phone: string;
  placeUrl: string;
  lat: number;
  lng: number;
  region: string;
  description: string;
  planType: string;
  isAd: true;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const moduleType = searchParams.get("module_type") ?? "dinner";
    const region = searchParams.get("region");

    const conditions = [
      "c.status = 'active'",
      "p.status = 'approved'",
      "c.start_date <= current_date",
      "c.end_date >= current_date",
    ];
    const params: unknown[] = [moduleType];
    conditions.push(`c.module_type = $1`);

    if (region) {
      params.push(`%${region}%`);
      conditions.push(`p.region ilike $${params.length}`);
    }

    const rows = await query<{
      business_name: string;
      category: string;
      address: string;
      contact_phone: string;
      place_url: string;
      lat: number;
      lng: number;
      region: string;
      description: string;
      plan_type: string;
    }>(
      `select p.business_name, p.category, p.address, p.contact_phone,
              p.place_url, p.lat, p.lng, p.region, p.description, c.plan_type
       from ad_contracts c
       join ad_partners p on p.id = c.partner_id
       where ${conditions.join(" and ")}
       order by c.priority asc, c.monthly_fee desc
       limit 5`,
      params
    );

    const places: SponsoredPlace[] = rows.map((r) => ({
      name: r.business_name,
      category: r.category === "restaurant" ? "음식점 > 제휴" : r.category,
      address: r.address ?? "",
      phone: r.contact_phone ?? "",
      placeUrl: r.place_url ?? "",
      lat: r.lat ?? 0,
      lng: r.lng ?? 0,
      region: r.region ?? "",
      description: r.description ?? "",
      planType: r.plan_type,
      isAd: true,
    }));

    return NextResponse.json({ places });
  } catch {
    return NextResponse.json({ places: [] });
  }
}
