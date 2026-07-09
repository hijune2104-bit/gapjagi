// 대시보드 — 전체 현황
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  totalPartners: number;
  approvedPartners: number;
  pendingPartners: number;
  activeContracts: number;
  monthlyRevenue: number;
  totalRevenue: number;
  byCategory: { category: string; count: number }[];
  byPlan: { plan_type: string; count: number; revenue: number }[];
  eventStats: { total: number; voting: number; closed: number; done: number; totalVotes: number };
  memberCount: number;
  adPerformance: { partner: string; impressions: number; clicks: number }[];
  totalImpressions: number;
  totalClicks: number;
  expiringContracts: { id: string; business_name: string; end_date: string; days_left: number }[];
}

const categoryLabel: Record<string, string> = {
  restaurant: "음식점",
  travel: "여행지",
  venue: "워크샵 장소",
};
const planLabel: Record<string, string> = {
  basic: "Basic",
  premium: "Premium",
  vip: "VIP",
};
const planColor: Record<string, string> = { basic: "", premium: "mint", vip: "blue" };

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <div className="adm-empty"><p>불러오는 중...</p></div>;
  }

  const maxCat = Math.max(...stats.byCategory.map((c) => c.count), 1);
  const maxPlan = Math.max(...stats.byPlan.map((p) => p.revenue), 1);
  const ev = stats.eventStats;

  return (
    <>
      <div className="adm-header">
        <h1>대시보드</h1>
      </div>

      {/* 만료 임박 알림 */}
      {stats.expiringContracts.length > 0 && (
        <div style={{ background: "#fff6e9", border: "1px solid #f3d19a", borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#b77400", marginBottom: 8 }}>
            ⚠ 만료 임박 계약 ({stats.expiringContracts.length}건)
          </h3>
          {stats.expiringContracts.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
              <span style={{ fontWeight: 700 }}>{c.business_name}</span>
              <span style={{ color: c.days_left <= 3 ? "#a32d2d" : "#b77400", fontWeight: 700 }}>
                {c.days_left === 0 ? "오늘 만료" : `${c.days_left}일 남음 (${c.end_date})`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 서비스 현황 */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: "#83828b" }}>서비스 현황</h2>
      <div className="adm-stats">
        <div className="adm-stat">
          <div className="adm-stat-label">전체 이벤트</div>
          <div className="adm-stat-value">{fmt(ev.total)}</div>
          <div className="adm-stat-sub">
            투표중 {ev.voting} / 마감 {ev.closed} / 완료 {ev.done}
          </div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">총 투표 수</div>
          <div className="adm-stat-value coral">{fmt(ev.totalVotes)}</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">등록 멤버</div>
          <div className="adm-stat-value">{fmt(stats.memberCount)}</div>
        </div>
      </div>

      {/* 광고 수익 현황 */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, marginTop: 28, color: "#83828b" }}>광고 수익</h2>
      <div className="adm-stats">
        <div className="adm-stat">
          <div className="adm-stat-label">광고 파트너</div>
          <div className="adm-stat-value">{fmt(stats.totalPartners)}</div>
          <div className="adm-stat-sub">
            승인 {stats.approvedPartners} / 대기 {stats.pendingPartners}
          </div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">활성 계약</div>
          <div className="adm-stat-value">{fmt(stats.activeContracts)}</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">월 광고 수익</div>
          <div className="adm-stat-value coral">{fmt(stats.monthlyRevenue)}원</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">누적 수익</div>
          <div className="adm-stat-value">{fmt(stats.totalRevenue)}원</div>
        </div>
      </div>

      {/* 차트 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="adm-chart-card">
          <h3>카테고리별 파트너</h3>
          {stats.byCategory.length === 0 && (
            <p style={{ color: "#83828b", fontSize: 13 }}>아직 데이터가 없습니다.</p>
          )}
          {stats.byCategory.map((c) => (
            <div key={c.category} className="adm-bar-row">
              <span className="adm-bar-label">{categoryLabel[c.category] ?? c.category}</span>
              <div className="adm-bar-track">
                <div className="adm-bar-fill" style={{ width: `${(c.count / maxCat) * 100}%` }} />
              </div>
              <span className="adm-bar-value">{c.count}개</span>
            </div>
          ))}
        </div>
        <div className="adm-chart-card">
          <h3>플랜별 월 수익</h3>
          {stats.byPlan.length === 0 && (
            <p style={{ color: "#83828b", fontSize: 13 }}>아직 데이터가 없습니다.</p>
          )}
          {stats.byPlan.map((p) => (
            <div key={p.plan_type} className="adm-bar-row">
              <span className="adm-bar-label">{planLabel[p.plan_type] ?? p.plan_type}</span>
              <div className="adm-bar-track">
                <div className={`adm-bar-fill ${planColor[p.plan_type] ?? ""}`} style={{ width: `${(p.revenue / maxPlan) * 100}%` }} />
              </div>
              <span className="adm-bar-value">{fmt(p.revenue)}원</span>
            </div>
          ))}
        </div>
      </div>

      {/* 광고 성과 */}
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, marginTop: 28, color: "#83828b" }}>광고 성과</h2>
      <div className="adm-stats">
        <div className="adm-stat">
          <div className="adm-stat-label">총 노출</div>
          <div className="adm-stat-value">{fmt(stats.totalImpressions)}</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">총 클릭</div>
          <div className="adm-stat-value">{fmt(stats.totalClicks)}</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">클릭률 (CTR)</div>
          <div className="adm-stat-value coral">
            {stats.totalImpressions > 0
              ? `${((stats.totalClicks / stats.totalImpressions) * 100).toFixed(1)}%`
              : "-"}
          </div>
        </div>
      </div>

      {stats.adPerformance.length > 0 && (
        <div className="adm-chart-card" style={{ marginTop: 16 }}>
          <h3>파트너별 성과</h3>
          {stats.adPerformance.map((p) => {
            const maxImp = Math.max(...stats.adPerformance.map((x) => x.impressions), 1);
            return (
              <div key={p.partner} className="adm-bar-row">
                <span className="adm-bar-label">{p.partner}</span>
                <div className="adm-bar-track">
                  <div className="adm-bar-fill" style={{ width: `${(p.impressions / maxImp) * 100}%` }} />
                </div>
                <span className="adm-bar-value" style={{ width: 100 }}>
                  {p.impressions}노출 / {p.clicks}클릭
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 바로가기 */}
      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        <Link href="/admin/events" className="adm-btn ghost">이벤트 관리 →</Link>
        <Link href="/admin/members" className="adm-btn ghost">멤버 관리 →</Link>
        <Link href="/admin/partners" className="adm-btn ghost">파트너 관리 →</Link>
        <Link href="/admin/contracts" className="adm-btn ghost">계약 관리 →</Link>
      </div>
    </>
  );
}
