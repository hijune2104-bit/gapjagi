// 광고 파트너 목록
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdPartnerRow, AdPartnerStatus } from "@/lib/types";

const statusLabel: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "거절",
  paused: "중지",
};
const categoryLabel: Record<string, string> = {
  restaurant: "음식점",
  travel: "여행지",
  venue: "장소",
};

const filters: { label: string; value: AdPartnerStatus | "" }[] = [
  { label: "전체", value: "" },
  { label: "대기", value: "pending" },
  { label: "승인", value: "approved" },
  { label: "거절", value: "rejected" },
  { label: "중지", value: "paused" },
];

export default function PartnersPage() {
  const [partners, setPartners] = useState<AdPartnerRow[]>([]);
  const [filter, setFilter] = useState<AdPartnerStatus | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/partners${qs}`)
      .then((r) => r.json())
      .then((data) => {
        setPartners(data);
        setLoading(false);
      });
  }, [filter]);

  return (
    <>
      <div className="adm-header">
        <h1>광고 파트너</h1>
        <div className="adm-header-actions">
          <a href="/api/admin/export?type=partners" className="adm-btn ghost" download>CSV 내보내기</a>
          <Link href="/admin/partners/new" className="adm-btn primary">
            + 파트너 등록
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
      ) : partners.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-icon">🏢</div>
          <p>등록된 파트너가 없습니다.</p>
          <Link href="/admin/partners/new" className="adm-btn primary">
            첫 파트너 등록하기
          </Link>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>업체명</th>
                <th>카테고리</th>
                <th>권역</th>
                <th>연락처</th>
                <th>상태</th>
                <th>등록일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.business_name}</td>
                  <td>{categoryLabel[p.category] ?? p.category}</td>
                  <td>{p.region ?? "-"}</td>
                  <td>
                    {p.contact_name ?? ""}{" "}
                    {p.contact_phone && (
                      <span style={{ color: "#83828b", fontSize: 12 }}>
                        {p.contact_phone}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`adm-badge ${p.status}`}>
                      {statusLabel[p.status]}
                    </span>
                  </td>
                  <td style={{ color: "#83828b", fontSize: 13 }}>
                    {new Date(p.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td>
                    <Link
                      href={`/admin/partners/${p.id}`}
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
