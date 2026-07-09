import { NextRequest, NextResponse } from "next/server";
import { listAllEvents } from "@/features/event/queries";

// GET /api/admin/events?status=voting&module_type=dinner
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const module_type = searchParams.get("module_type") ?? undefined;
    const events = await listAllEvents({
      ...(status && { status }),
      ...(module_type && { module_type }),
    });
    return NextResponse.json(events);
  } catch {
    return NextResponse.json([]);
  }
}
