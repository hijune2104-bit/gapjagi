// 공용 UI 조각들. 스타일만 담당하고 상태는 부모가 관리합니다.
// (팀 디자인 확정 시 여기 클래스만 교체하면 전체 화면에 반영됩니다.)
import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 ${className}`}
    >
      {children}
    </div>
  );
}

// 탭탭탭 선택지용 칩. selected 여부에 따라 색이 바뀝니다.
export function Chip({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition active:scale-95 ${
        selected
          ? "bg-orange-500 text-white shadow-sm"
          : "bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-stone-300"
      }`}
    >
      {children}
    </button>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "ghost";
  className?: string;
};

export function Button({
  children,
  onClick,
  disabled,
  type = "button",
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "w-full rounded-2xl px-5 py-4 text-base font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const styles =
    variant === "primary"
      ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
      : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-stone-300";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const base =
    "block w-full rounded-2xl px-5 py-4 text-center text-base font-semibold transition active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
      : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-stone-300";
  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

// 상단 진행 단계 표시 (1 투표지 · 2 결과 · 3 추천안)
export function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["투표지", "결과", "추천안"];
  return (
    <div className="flex items-center gap-1.5 px-5 pt-4 text-xs">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = n <= step;
        return (
          <div key={label} className="flex flex-1 items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                active ? "bg-orange-500 text-white" : "bg-stone-200 text-stone-400"
              }`}
            >
              {n}
            </span>
            <span
              className={active ? "font-semibold text-stone-700" : "text-stone-400"}
            >
              {label}
            </span>
            {i < 2 && <div className="h-px flex-1 bg-stone-200" />}
          </div>
        );
      })}
    </div>
  );
}
