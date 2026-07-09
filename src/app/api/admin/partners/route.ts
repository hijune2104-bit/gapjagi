import { NextRequest, NextResponse } from "next/server";
import { listPartners, createPartner } from "@/features/ad/queries";
import type { AdPartnerCategory, AdPartnerStatus } from "@/lib/types";

// GET /api/admin/partners?status=approved&category=restaurant
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") as AdPartnerStatus | null;
    const category = searchParams.get("category") as AdPartnerCategory | null;
    const partners = await listPartners({
      ...(status && { status }),
      ...(category && { category }),
    });
    return NextResponse.json(partners);
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/admin/partners
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.business_name?.trim()) {
      return NextResponse.json({ error: "업체명은 필수입니다." }, { status: 400 });
    }
    const partner = await createPartner({
      business_name: body.business_name.trim(),
      category: body.category ?? "restaurant",
      contact_name: body.contact_name,
      contact_phone: body.contact_phone,
      contact_email: body.contact_email,
      description: body.description,
      address: body.address,
      region: body.region,
      lat: body.lat ? Number(body.lat) : undefined,
      lng: body.lng ? Number(body.lng) : undefined,
      place_url: body.place_url,
      photo_url: body.photo_url,
    });
    return NextResponse.json(partner, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "DB 연결 실패. 테이블을 먼저 생성하세요." }, { status: 500 });
  }
}
