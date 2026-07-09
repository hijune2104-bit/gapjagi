import { NextRequest, NextResponse } from "next/server";
import { listContracts, createContract } from "@/features/ad/queries";
import type { AdContractStatus, ModuleType } from "@/lib/types";

// GET /api/admin/contracts?status=active&partner_id=xxx&module_type=dinner
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") as AdContractStatus | null;
    const partner_id = searchParams.get("partner_id");
    const module_type = searchParams.get("module_type") as ModuleType | null;
    const contracts = await listContracts({
      ...(status && { status }),
      ...(partner_id && { partner_id }),
      ...(module_type && { module_type }),
    });
    return NextResponse.json(contracts);
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/admin/contracts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.partner_id || !body.start_date || !body.end_date) {
      return NextResponse.json(
        { error: "partner_id, start_date, end_date는 필수입니다." },
        { status: 400 }
      );
    }
    const contract = await createContract({
      partner_id: body.partner_id,
      module_type: body.module_type ?? "dinner",
      plan_type: body.plan_type ?? "basic",
      monthly_fee: Number(body.monthly_fee) || 0,
      start_date: body.start_date,
      end_date: body.end_date,
      priority: body.priority ? Number(body.priority) : undefined,
      memo: body.memo,
    });
    return NextResponse.json(contract, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "DB 연결 실패. 테이블을 먼저 생성하세요." }, { status: 500 });
  }
}
