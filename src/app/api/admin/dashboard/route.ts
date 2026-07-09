import { NextResponse } from "next/server";
import { getDashboardStats } from "@/features/ad/queries";
import { query } from "@/lib/db";

// GET /api/admin/dashboard
export async function GET() {
  // 광고 통계
  let adStats = {
    totalPartners: 0,
    approvedPartners: 0,
    pendingPartners: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    byCategory: [] as { category: string; count: number }[],
    byPlan: [] as { plan_type: string; count: number; revenue: number }[],
  };
  try {
    adStats = await getDashboardStats();
  } catch {}

  // 이벤트/멤버 통계
  let eventStats = { total: 0, voting: 0, closed: 0, done: 0, totalVotes: 0 };
  let memberCount = 0;
  try {
    const [es] = await query<{
      total: string;
      voting: string;
      closed: string;
      done: string;
      total_votes: string;
    }>(
      `select
         count(*)::int as total,
         count(*) filter (where status='voting')::int as voting,
         count(*) filter (where status='closed')::int as closed,
         count(*) filter (where status='done')::int as done,
         (select count(*)::int from votes) as total_votes
       from events`
    );
    eventStats = {
      total: Number(es.total),
      voting: Number(es.voting),
      closed: Number(es.closed),
      done: Number(es.done),
      totalVotes: Number(es.total_votes),
    };
    const [mc] = await query<{ n: string }>(`select count(*)::int as n from members`);
    memberCount = Number(mc.n);
  } catch {}

  // 광고 성과
  let adPerformance: { partner: string; impressions: number; clicks: number }[] = [];
  let totalImpressions = 0;
  let totalClicks = 0;
  try {
    const perfRows = await query<{ business_name: string; impressions: string; clicks: string }>(
      `select p.business_name,
         count(*) filter (where i.event_type = 'impression')::int as impressions,
         count(*) filter (where i.event_type = 'click')::int as clicks
       from ad_impressions i
       join ad_partners p on p.id = i.partner_id
       group by p.business_name
       order by impressions desc`
    );
    adPerformance = perfRows.map((r) => ({
      partner: r.business_name,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
    }));
    const [totals] = await query<{ imp: string; clk: string }>(
      `select count(*) filter (where event_type='impression')::int as imp,
              count(*) filter (where event_type='click')::int as clk
       from ad_impressions`
    );
    totalImpressions = Number(totals.imp);
    totalClicks = Number(totals.clk);
  } catch {}

  return NextResponse.json({ ...adStats, eventStats, memberCount, adPerformance, totalImpressions, totalClicks });
}
