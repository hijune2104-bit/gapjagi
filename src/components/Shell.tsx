"use client";

// 공용 화면 셸 — gapjagi.html 의 폰 프레임 구조(bar + scroll + cta-wrap)를 재현.
// 각 페이지가 이 셸로 콘텐츠를 감싼다.
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

// 상단 로고 (프로토타입 SVG 마크 + "갑자기")
function Logo() {
  return (
    <Link href="/" className="logo" aria-label="갑자기 홈">
      <span className="mark">
        <svg viewBox="0 14 128 98" width="34" height="26" aria-hidden="true">
          <rect x="4" y="20" width="86" height="86" rx="23" fill="#F0513C" />
          <rect
            x="15"
            y="31"
            width="64"
            height="64"
            rx="17"
            fill="none"
            stroke="#F7EEE3"
            strokeOpacity="0.55"
            strokeWidth="4"
          />
          <text
            x="47"
            y="64"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Pretendard,sans-serif"
            fontWeight="800"
            fontSize="52"
            fill="#1A1A1E"
          >
            갑
          </text>
          <path
            d="M111 16 Q111 23 118 23 Q111 23 111 30 Q111 23 104 23 Q111 23 111 16 Z"
            fill="#FDB022"
          />
          <path
            d="M104 31 Q104 43 116 43 Q104 43 104 55 Q104 43 92 43 Q104 43 104 31 Z"
            fill="#F0513C"
          />
          <path
            d="M119 52 Q119 58 125 58 Q119 58 119 64 Q119 58 113 58 Q119 58 119 52 Z"
            fill="#F0513C"
          />
        </svg>
      </span>
      <span className="wm">자기</span>
    </Link>
  );
}

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
        <Logo />
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
