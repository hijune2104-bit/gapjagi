// 광고 계약 목록
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdContractWithPartner, AdContractStatus } from "@/lib/types";

const statusLabel: Record<string, string> = {
  active: "활성",
  paused: "중지",
  expired: "만료",
  cancelled: "해지",
};
const planLabel: Record<string, string> = {
  basic: "Basic",
  premium: "Premium",
  vip: "VIP",
};
const moduleLabel: Record<string, string> = {
  dinner: "회식",
  trip: "여행",
  workshop: "워크샵",
};

const filters: { label: string; value: AdContractStatus | "" }[] = [
  { label: "전체", value: "" },
  { label: "활성", value: "active" },
  { label: "중지", value: "paused" },
  { label: "만료", value: "expired" },
  { label: "해지", value: "cancelled" },
];

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<AdContractWithPartner[]>([]);
  const [filter, setFilter] = useState<AdContractStatus | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/contracts${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setContracts(data);
        setLoading(false);
      });
  }, [filter]);

  return (
    <>
      <div className="adm-header">
        <h1>광고 계약</h1>
        <div className="adm-header-actions">
          <Link href="/admin/contracts/new" className="adm-btn primary">
            + 계약 등록
          </Link>
        </div>
      </div>

      <div className="adm-filters">
        {filters.map((f) => (
          <button
            key={f.value}
            className={`adm-filter-chip${filter === f.value ? " on" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="adm-empty"><p>불러오는 중...</p></div>
      ) : contracts.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-icon">📋</div>
          <p>등록된 계약이 없습니다.</p>
          <Link href="/admin/contracts/new" className="adm-btn primary">
            첫 계약 등록하기
          </Link>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>업체명</th>
                <th>모듈</th>
                <th>플랜</th>
                <th>월 광고비</th>
                <th>기간</th>
                <th>우선순위</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.business_name}</td>
                  <td>
                    <span className="adm-badge basic">
                      {moduleLabel[c.module_type] ?? c.module_type}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-badge ${c.plan_type}`}>
                      {planLabel[c.plan_type]}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{fmt(c.monthly_fee)}원</td>
                  <td style={{ fontSize: 13, color: "#83828b" }}>
                    {c.start_date} ~ {c.end_date}
                  </td>
                  <td style={{ textAlign: "center" }}>{c.priority}</td>
                  <td>
                    <span className={`adm-badge ${c.status}`}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/contracts/${c.id}`}
                      className="adm-btn ghost sm"
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
