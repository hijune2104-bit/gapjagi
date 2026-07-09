// 갑자기 로고 (logo.png 를 보고 벡터로 재현). 마크(코랄 squircle + "갑" + 반짝이) + "자기".
// 벡터라 어떤 크기에서도 선명. height 로 크기 조절.
export default function Logo({ height = 28 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 210 96"
      height={height}
      width={(height * 210) / 96}
      aria-label="갑자기"
      role="img"
      style={{ display: "block" }}
    >
      {/* 마크(박스+안쪽선+갑)를 통째로 살짝 반시계 회전 — 원본처럼 박스도 함께 기울임 */}
      <g transform="rotate(-9 44 50)">
        {/* 코랄 squircle */}
        <rect x="6" y="12" width="76" height="76" rx="24" fill="#FF5A32" />
        {/* 안쪽 라운드 스트로크 */}
        <rect
          x="15"
          y="21"
          width="58"
          height="58"
          rx="16"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.5"
          strokeWidth="3.5"
        />
        {/* "갑" */}
        <text
          x="44"
          y="52"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Pretendard, sans-serif"
          fontWeight="800"
          fontSize="44"
          fill="#1A1A1E"
        >
          갑
        </text>
      </g>
      {/* 반짝이 (코랄 큰 것 + 노랑 작은 것) */}
      <path
        d="M86 13 Q86 24 97 24 Q86 24 86 35 Q86 24 75 24 Q86 24 86 13 Z"
        fill="#FF5A32"
      />
      <path
        d="M99 3 Q99 9 105 9 Q99 9 99 15 Q99 9 93 9 Q99 9 99 3 Z"
        fill="#FDB022"
      />
      {/* "자기" */}
      <text
        x="96"
        y="52"
        textAnchor="start"
        dominantBaseline="central"
        fontFamily="Pretendard, sans-serif"
        fontWeight="800"
        fontSize="58"
        letterSpacing="-2"
        fill="#1A1A1E"
      >
        자기
      </text>
    </svg>
  );
}
