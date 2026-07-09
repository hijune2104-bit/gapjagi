"use client";

// 공유 페이지 상단 액션 바: 링크 복사 / 공유하기 / 인쇄(PDF 저장).
import { useState } from "react";

export default function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    // 모바일에서 네이티브 공유 시트. 미지원이면 링크 복사로 폴백.
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {
        /* 사용자가 취소 */
      }
    } else {
      copyLink();
    }
  }

  return (
    <div className="flex gap-2 print:hidden">
      <button
        onClick={share}
        className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white active:scale-[0.98]"
      >
        📤 공유하기
      </button>
      <button
        onClick={copyLink}
        className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-stone-600 ring-1 ring-stone-200 active:scale-[0.98]"
      >
        {copied ? "복사됨!" : "🔗 링크 복사"}
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-stone-600 ring-1 ring-stone-200 active:scale-[0.98]"
      >
        🖨️
      </button>
    </div>
  );
}
