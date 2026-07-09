// 수익 모델 안내 (C-05).
"use client";

import Shell from "@/components/Shell";

const flows = [
  {
    title: "권역별 상단 노출 슬롯",
    desc: "식당이 자기 권역(성수·강남 등) 후보 상단 자리를 구매. 항상 'AD·제휴'로 명시.",
  },
  {
    title: "예약 전환 수수료",
    desc: "확정·예약이 실제 발생하면 건당 수수료. 팀 투표 결과는 조작하지 않음.",
  },
  {
    title: "지역 수요 데이터",
    desc: "'성수권·10인·고기' 같은 실수요 리포트를 제휴 식당·상권에 제공.",
  },
];

export default function RevenuePage() {
  return (
    <Shell>
      <div className="rev-hero">
        <div className="k">BUSINESS MODEL</div>
        <h2>
          팀이 실제로 정하고 예약하는
          <br />
          바로 그 순간에 수익이 납니다.
        </h2>
      </div>

      <div className="rev-stats">
        <div className="rev-stat">
          <b>3종</b>
          <span>광고·수수료·데이터 수익 축</span>
        </div>
        <div className="rev-stat">
          <b>0원</b>
          <span>참여자 진입 비용 (무설치·무로그인)</span>
        </div>
      </div>

      <div className="cardbox">
        <h3>수익 구조</h3>
        {flows.map((f, i) => (
          <div key={f.title} className="flow-step">
            <div className="num">{i + 1}</div>
            <div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="addisclosure">
        투명성 원칙 — 제휴는 항상 광고로 명시하고, 투표·선택은 팀 자유입니다.
        신뢰가 곧 전환율입니다.
      </p>
    </Shell>
  );
}
