// POST /api/ad/track — 광고 노출/클릭 기록
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { partner_name, event_type, module_type, region } = await req.json();
    if (!partner_name || !event_type) {
      return NextResponse.json({ error: "partner_name, event_type 필수" }, { status: 400 });
    }
    // partner_name으로 partner_id 조회
    const [partner] = await query<{ id: string }>(
      `select id from ad_partners where business_name = $1 limit 1`,
      [partner_name]
    );
    if (!partner) return NextResponse.json({ ok: true }); // 파트너 못 찾으면 무시

    await query(
      `insert into ad_impressions (partner_id, event_type, module_type, region) values ($1, $2, $3, $4)`,
      [partner.id, event_type, module_type ?? "dinner", region ?? null]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // 추적 실패해도 사용자 경험에 영향 없게
  }
}
