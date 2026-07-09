"use client";

// 공용 화면 셸 — gapjagi.html 의 폰 프레임 구조(bar + scroll + cta-wrap)를 재현.
// 각 페이지가 이 셸로 콘텐츠를 감싼다.
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";

// 진행 단계 표시 (라벨 + 점). active(0-based)까지 on.
function Steps({ labels, active }: { labels: string[]; active: number }) {
  return (
    <div className="steps">
      {labels.map((label, i) => (
        <span key={label} className="contents">
          {i > 0 && <i className={i <= active ? "on" : ""} />}
          <span className={i <= active ? "on" : ""}>{label}</span>
        </span>
      ))}
    </div>
  );
}

export default function Shell({
  children,
  back = true,
  steps,
  activeStep = 0,
  headerRight,
  cta,
}: {
  children: ReactNode;
  back?: boolean;
  steps?: string[];
  activeStep?: number;
  headerRight?: ReactNode;
  cta?: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="phone">
      <div className={`bar${back ? " has-back" : ""}`}>
        {back && (
          <button className="back" onClick={() => router.back()} aria-label="뒤로">
            ←
          </button>
        )}
        <Link href="/" className="logo" aria-label="갑자기 홈">
          <Logo />
        </Link>
        {steps ? (
          <Steps labels={steps} active={activeStep} />
        ) : headerRight ? (
          <div className="steps">{headerRight}</div>
        ) : null}
      </div>
      <div className="scroll">
        <div className="screen">{children}</div>
      </div>
      {cta ? <div className="cta-wrap">{cta}</div> : null}
    </div>
  );
}
