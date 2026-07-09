// 계약 상세/수정
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdContractWithPartner, AdContractStatus } from "@/lib/types";

const statusOptions: { value: AdContractStatus; label: string }[] = [
  { value: "active", label: "활성" },
  { value: "paused", label: "중지" },
  { value: "expired", label: "만료" },
  { value: "cancelled", label: "해지" },
];

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<AdContractWithPartner | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/contracts/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setContract);
  }, [id]);

  if (!contract) {
    return <div className="adm-empty"><p>불러오는 중...</p></div>;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      module_type: fd.get("module_type"),
      plan_type: fd.get("plan_type"),
      monthly_fee: Number(fd.get("monthly_fee")) || 0,
      start_date: fd.get("start_date"),
      end_date: fd.get("end_date"),
      priority: Number(fd.get("priority")) || 5,
      status: fd.get("status") as AdContractStatus,
      memo: fd.get("memo") || null,
    };
    const res = await fetch(`/api/admin/contracts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setContract({ ...updated, business_name: contract!.business_name, category: contract!.category });
      alert("저장되었습니다.");
    } else {
      alert("저장 실패");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("이 계약을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/contracts/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/contracts");
    else alert("삭제 실패");
  }

  return (
    <>
      <div className="adm-header">
        <h1>계약 상세</h1>
        <div className="adm-header-actions">
          <button className="adm-btn danger" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>

      <div className="adm-stats" style={{ marginBottom: 20 }}>
        <div className="adm-stat">
          <div className="adm-stat-label">파트너</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{contract.business_name}</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">월 광고비</div>
          <div className="adm-stat-value coral">{fmt(contract.monthly_fee)}원</div>
        </div>
      </div>

      <form className="adm-form" onSubmit={handleSubmit}>
        <div className="adm-row">
          <div className="adm-field">
            <label>노출 모듈</label>
            <select name="module_type" className="adm-select" defaultValue={contract.module_type}>
              <option value="dinner">회식</option>
              <option value="trip">여행</option>
              <option value="workshop">워크샵</option>
            </select>
          </div>
          <div className="adm-field">
            <label>광고 플랜</label>
            <select name="plan_type" className="adm-select" defaultValue={contract.plan_type}>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </div>
        </div>

        <div className="adm-row">
          <div className="adm-field">
            <label>월 광고비 (원)</label>
            <input name="monthly_fee" className="adm-input" type="number" min="0" step="10000" defaultValue={contract.monthly_fee} />
          </div>
          <div className="adm-field">
            <label>우선순위</label>
            <input name="priority" className="adm-input" type="number" min="1" max="10" defaultValue={contract.priority} />
          </div>
        </div>

        <div className="adm-row">
          <div className="adm-field">
            <label>시작일</label>
            <input name="start_date" className="adm-input" type="date" defaultValue={contract.start_date} />
          </div>
          <div className="adm-field">
            <label>종료일</label>
            <input name="end_date" className="adm-input" type="date" defaultValue={contract.end_date} />
          </div>
        </div>

        <div className="adm-field">
          <label>상태</label>
          <select name="status" className="adm-select" defaultValue={contract.status}>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="adm-field">
          <label>메모</label>
          <textarea name="memo" className="adm-textarea" defaultValue={contract.memo ?? ""} />
        </div>

        <div className="adm-form-actions">
          <button type="submit" className="adm-btn primary" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
          <button type="button" className="adm-btn ghost" onClick={() => router.back()}>
            뒤로
          </button>
        </div>
      </form>
    </>
  );
}
