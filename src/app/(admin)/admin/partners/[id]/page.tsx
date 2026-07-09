// 파트너 상세/수정
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdPartnerRow, AdPartnerStatus, AdPartnerCategory } from "@/lib/types";

const statusOptions: { value: AdPartnerStatus; label: string }[] = [
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" },
  { value: "paused", label: "중지" },
];

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [partner, setPartner] = useState<AdPartnerRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/partners/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setPartner);
  }, [id]);

  if (!partner) {
    return <div className="adm-empty"><p>불러오는 중...</p></div>;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      business_name: fd.get("business_name"),
      category: fd.get("category") as AdPartnerCategory,
      contact_name: fd.get("contact_name") || null,
      contact_phone: fd.get("contact_phone") || null,
      contact_email: fd.get("contact_email") || null,
      description: fd.get("description") || null,
      address: fd.get("address") || null,
      region: fd.get("region") || null,
      place_url: fd.get("place_url") || null,
      status: fd.get("status") as AdPartnerStatus,
    };
    const res = await fetch(`/api/admin/partners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setPartner(updated);
      alert("저장되었습니다.");
    } else {
      alert("저장 실패");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`"${partner!.business_name}" 파트너를 삭제하시겠습니까?\n관련 계약도 모두 삭제됩니다.`)) return;
    const res = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/partners");
    else alert("삭제 실패");
  }

  return (
    <>
      <div className="adm-header">
        <h1>파트너 상세</h1>
        <div className="adm-header-actions">
          <Link href={`/admin/contracts/new?partner_id=${id}`} className="adm-btn ghost">
            + 계약 추가
          </Link>
          <button className="adm-btn danger" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>

      <form className="adm-form" onSubmit={handleSubmit}>
        <div className="adm-row">
          <div className="adm-field">
            <label>업체명 *</label>
            <input name="business_name" className="adm-input" defaultValue={partner.business_name} required />
          </div>
          <div className="adm-field">
            <label>상태</label>
            <select name="status" className="adm-select" defaultValue={partner.status}>
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="adm-row">
          <div className="adm-field">
            <label>카테고리</label>
            <select name="category" className="adm-select" defaultValue={partner.category}>
              <option value="restaurant">음식점</option>
              <option value="travel">여행지</option>
              <option value="venue">워크샵 장소</option>
            </select>
          </div>
          <div className="adm-field">
            <label>권역</label>
            <input name="region" className="adm-input" defaultValue={partner.region ?? ""} />
          </div>
        </div>

        <div className="adm-field">
          <label>주소</label>
          <input name="address" className="adm-input" defaultValue={partner.address ?? ""} />
        </div>

        <div className="adm-row">
          <div className="adm-field">
            <label>담당자명</label>
            <input name="contact_name" className="adm-input" defaultValue={partner.contact_name ?? ""} />
          </div>
          <div className="adm-field">
            <label>연락처</label>
            <input name="contact_phone" className="adm-input" defaultValue={partner.contact_phone ?? ""} />
          </div>
        </div>

        <div className="adm-field">
          <label>이메일</label>
          <input name="contact_email" className="adm-input" type="email" defaultValue={partner.contact_email ?? ""} />
        </div>

        <div className="adm-field">
          <label>업체 소개</label>
          <textarea name="description" className="adm-textarea" defaultValue={partner.description ?? ""} />
        </div>

        <div className="adm-field">
          <label>카카오맵 / 웹사이트 URL</label>
          <input name="place_url" className="adm-input" defaultValue={partner.place_url ?? ""} />
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
