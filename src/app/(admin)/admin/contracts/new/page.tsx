// 계약 등록 폼
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdPartnerRow } from "@/lib/types";

export default function NewContractPage() {
  return (
    <Suspense fallback={<div className="adm-empty"><p>불러오는 중...</p></div>}>
      <NewContractForm />
    </Suspense>
  );
}

function NewContractForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPartner = searchParams.get("partner_id") ?? "";
  const [partners, setPartners] = useState<AdPartnerRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/partners?status=approved")
      .then((r) => r.json())
      .then(setPartners);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      partner_id: fd.get("partner_id"),
      module_type: fd.get("module_type"),
      plan_type: fd.get("plan_type"),
      monthly_fee: Number(fd.get("monthly_fee")) || 0,
      start_date: fd.get("start_date"),
      end_date: fd.get("end_date"),
      priority: Number(fd.get("priority")) || 5,
      memo: fd.get("memo") || undefined,
    };
    const res = await fetch("/api/admin/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.push("/admin/contracts");
    } else {
      alert("저장 실패");
      setSaving(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="adm-header">
        <h1>계약 등록</h1>
      </div>

      <form className="adm-form" onSubmit={handleSubmit}>
        <div className="adm-field">
          <label>파트너 업체 *</label>
          <select name="partner_id" className="adm-select" required defaultValue={preselectedPartner}>
            <option value="">선택하세요</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.business_name} ({p.region ?? "권역 미설정"})
              </option>
            ))}
          </select>
          {partners.length === 0 && (
            <div className="hint">승인된 파트너가 없습니다. 먼저 파트너를 등록하고 승인하세요.</div>
          )}
        </div>

        <div className="adm-row">
          <div className="adm-field">
            <label>노출 모듈</label>
            <select name="module_type" className="adm-select" defaultValue="dinner">
              <option value="dinner">회식</option>
              <option value="trip">여행</option>
              <option value="workshop">워크샵</option>
            </select>
          </div>
          <div className="adm-field">
            <label>광고 플랜</label>
            <select name="plan_type" className="adm-select" defaultValue="basic">
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
            <div className="hint">VIP: 상단 고정 / Premium: 상위 노출 / Basic: 일반 노출</div>
          </div>
        </div>

        <div className="adm-row">
          <div className="adm-field">
            <label>월 광고비 (원) *</label>
            <input
              name="monthly_fee"
              className="adm-input"
              type="number"
              min="0"
              step="10000"
              required
              placeholder="예: 300000"
            />
          </div>
          <div className="adm-field">
            <label>노출 우선순위</label>
            <input
              name="priority"
              className="adm-input"
              type="number"
              min="1"
              max="10"
              defaultValue="5"
            />
            <div className="hint">1(최상위) ~ 10(최하위)</div>
          </div>
        </div>

        <div className="adm-row">
          <div className="adm-field">
            <label>시작일 *</label>
            <input name="start_date" className="adm-input" type="date" required defaultValue={today} />
          </div>
          <div className="adm-field">
            <label>종료일 *</label>
            <input name="end_date" className="adm-input" type="date" required />
          </div>
        </div>

        <div className="adm-field">
          <label>메모</label>
          <textarea name="memo" className="adm-textarea" placeholder="계약 관련 메모" />
        </div>

        <div className="adm-form-actions">
          <button type="submit" className="adm-btn primary" disabled={saving}>
            {saving ? "저장 중..." : "등록하기"}
          </button>
          <button type="button" className="adm-btn ghost" onClick={() => router.back()}>
            취소
          </button>
        </div>
      </form>
    </>
  );
}
