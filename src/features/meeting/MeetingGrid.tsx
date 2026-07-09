"use client";

// 회의 시간 그리드 — 칠하는 그리드(PaintGrid) + 히트맵 그리드(HeatGrid).
// gapjagi.html 의 .grid/.gcell/.mine 클래스를 그대로 사용.
import { Fragment, useEffect, useRef } from "react";
import type { MeetingConfig } from "@/lib/types";
import { allSlotKeys } from "@/features/meeting/grid";

// 드래그로 여러 칸을 한 번에 칠하는 입력 그리드.
export function PaintGrid({
  config,
  value,
  onChange,
}: {
  config: MeetingConfig;
  value: string[];
  onChange: (slots: string[]) => void;
}) {
  const painting = useRef(false);
  const paintVal = useRef(true);
  const set = new Set(value);

  useEffect(() => {
    const up = () => {
      painting.current = false;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  function apply(key: string, add: boolean) {
    const next = new Set(value);
    if (add) next.add(key);
    else next.delete(key);
    onChange([...next]);
  }

  // 전체 선택/해제 토글
  const allKeys = allSlotKeys(config);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => set.has(k));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button
          type="button"
          className="chip sm"
          onClick={() => onChange(allSelected ? [] : allKeys)}
        >
          {allSelected ? "전체 해제" : "✓ 전체 선택"}
        </button>
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: `36px repeat(${config.days.length}, 1fr)` }}
      >
      <div className="gcell head" />
      {config.days.map((d) => (
        <div key={d} className="gcell head">
          {d}
        </div>
      ))}
      {config.hours.map((h) => (
        <Fragment key={h}>
          <div className="gcell timelabel">{h}시</div>
          {config.days.map((d) => {
            const key = `${d}-${h}`;
            const on = set.has(key);
            return (
              <div
                key={key}
                data-k={key}
                className={`gcell${on ? " mine" : ""}`}
                style={{ touchAction: "none", cursor: "pointer" }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  painting.current = true;
                  paintVal.current = !set.has(key);
                  apply(key, paintVal.current);
                }}
                onPointerEnter={() => {
                  if (painting.current) apply(key, paintVal.current);
                }}
              />
            );
          })}
        </Fragment>
      ))}
      </div>
    </>
  );
}

// 집계 결과를 색 농도로 보여주는 읽기 전용 히트맵.
export function HeatGrid({
  config,
  scores,
  maxScore,
  bestKey,
}: {
  config: MeetingConfig;
  scores: Record<string, number>;
  maxScore: number;
  bestKey?: string;
}) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `36px repeat(${config.days.length}, 1fr)` }}
    >
      <div className="gcell head" />
      {config.days.map((d) => (
        <div key={d} className="gcell head">
          {d}
        </div>
      ))}
      {config.hours.map((h) => (
        <Fragment key={h}>
          <div className="gcell timelabel">{h}시</div>
          {config.days.map((d) => {
            const key = `${d}-${h}`;
            const s = scores[key] ?? 0;
            const op = s / (maxScore || 1);
            const isBest = key === bestKey;
            return (
              <div
                key={key}
                className="gcell"
                style={{
                  background: s
                    ? `rgba(6,185,129,${0.15 + op * 0.75})`
                    : "var(--soft)",
                  color: op > 0.5 ? "#fff" : "#B7B5AE",
                  ...(isBest
                    ? { outline: "2px solid var(--coral)", outlineOffset: "-2px" }
                    : {}),
                }}
              >
                {s || ""}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
