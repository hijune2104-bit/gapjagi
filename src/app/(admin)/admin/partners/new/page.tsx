// 파트너 등록 폼
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdPartnerCategory } from "@/lib/types";

export default function NewPartnerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      business_name: fd.get("business_name"),
      category: fd.get("category") as AdPartnerCategory,
      contact_name: fd.get("contact_name") || undefined,
      contact_phone: fd.get("contact_phone") || undefined,
      contact_email: fd.get("contact_email") || undefined,
      description: fd.get("description") || undefined,
      address: fd.get("address") || undefined,
      region: fd.get("region") || undefined,
      place_url: fd.get("place_url") || undefined,
    };
    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      router.push("/admin/partners");
    } else {
      alert("저장 실패");
      setSaving(false);
    }
  }

  return (
    <>
      <div className="adm-header">
        <h1>파트너 등록</h1>
      </div>

      <form className="adm-form" onSubmit={handleSubmit}>
        <div className="adm-field">
          <label>업체명 *</label>
          <input name="business_name" className="adm-input" required />
        </div>

        <div className="adm-row">
          <div className="adm-field">
            <label>카테고리</label>
            <select name="category" className="adm-select" defaultValue="restaurant">
              <option value="restaurant">음식점</option>
              <option value="travel">여행지</option>
              <option value="venue">워크샵 장소</option>
            </select>
          </div>
          <div className="adm-field">
            <label>권역</label>
            <input name="region" className="adm-input" placeholder="예: 성수, 강남, 제주" />
          </div>
        </div>

        <div className="adm-field">
          <label>주소</label>
          <input name="address" className="adm-input" placeholder="도로명 주소" />
        </div>

        <div className="adm-row">
          <div className="adm-field">
            <label>담당자명</label>
            <input name="contact_name" className="adm-input" />
          </div>
          <div className="adm-field">
            <label>연락처</label>
            <input name="contact_phone" className="adm-input" placeholder="010-0000-0000" />
          </div>
        </div>

        <div className="adm-field">
          <label>이메일</label>
          <input name="contact_email" className="adm-input" type="email" />
        </div>

        <div className="adm-field">
          <label>업체 소개</label>
          <textarea name="description" className="adm-textarea" placeholder="업체에 대한 간단한 소개" />
        </div>

        <div className="adm-field">
          <label>카카오맵 / 웹사이트 URL</label>
          <input name="place_url" className="adm-input" placeholder="https://..." />
        </div>

        <div className="adm-form-actions">
          <button type="submit" className="adm-btn primary" disabled={saving}>
            {saving ? "저장 중..." : "등록하기"}
          </button>
          <button
            type="button"
            className="adm-btn ghost"
            onClick={() => router.back()}
          >
            취소
          </button>
        </div>
      </form>
    </>
  );
}
