// GET /api/admin/export?type=partners|contracts|events|members
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return "\uFEFF" + lines.join("\n"); // BOM for Excel 한글
}

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? "partners";
    let csv = "";
    let filename = "";

    switch (type) {
      case "partners": {
        const rows = await query(`select business_name, category, region, contact_name, contact_phone, contact_email, address, status, created_at from ad_partners order by created_at desc`);
        csv = toCsv(["business_name", "category", "region", "contact_name", "contact_phone", "contact_email", "address", "status", "created_at"], rows);
        filename = "partners.csv";
        break;
      }
      case "contracts": {
        const rows = await query(`select p.business_name, c.module_type, c.plan_type, c.monthly_fee, c.start_date, c.end_date, c.priority, c.status, c.memo, c.created_at from ad_contracts c join ad_partners p on p.id = c.partner_id order by c.created_at desc`);
        csv = toCsv(["business_name", "module_type", "plan_type", "monthly_fee", "start_date", "end_date", "priority", "status", "memo", "created_at"], rows);
        filename = "contracts.csv";
        break;
      }
      case "events": {
        const rows = await query(`select e.title, e.module_type, e.status, e.created_at, (select count(*)::int from votes v where v.event_id = e.id) as vote_count, (select count(distinct voter_name)::int from votes v where v.event_id = e.id) as voter_count from events e order by e.created_at desc`);
        csv = toCsv(["title", "module_type", "status", "created_at", "vote_count", "voter_count"], rows);
        filename = "events.csv";
        break;
      }
      case "members": {
        const rows = await query(`select account, name, synced_at from members order by name asc`);
        csv = toCsv(["account", "name", "synced_at"], rows);
        filename = "members.csv";
        break;
      }
      default:
        return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "export failed" }, { status: 500 });
  }
}
