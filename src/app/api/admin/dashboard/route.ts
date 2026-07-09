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

  return NextResponse.json({ ...adStats, eventStats, memberCount });
}
