"use client";

// 조직도 멤버 검색·선택 위젯. 참여자 지정에 사용.
// 부모가 선택 목록(value)과 onChange 를 관리하는 controlled 컴포넌트.
import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import type { Member } from "./queries";
import type { Participant } from "@/lib/types";

export default function MemberPicker({
  value,
  onChange,
}: {
  value: Participant[];
  onChange: (next: Participant[]) => void;
}) {
  const [all, setAll] = useState<Member[]>([]);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0); // 방향키로 선택 중인 후보 index

  useEffect(() => {
    fetch("/api/org/members")
      .then((r) => r.json())
      .then((d) => setAll(d.members ?? []))
      .catch(() => {});
  }, []);

  const picked = new Set(value.map((p) => p.account));

  // 검색어가 있을 때만 후보 노출 (1082명 전체를 항상 그리지 않도록). 최대 12개.
  const matches = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [];
    return all
      .filter(
        (m) =>
          !picked.has(m.account) &&
          (m.name.toLowerCase().includes(kw) ||
            m.account.toLowerCase().includes(kw))
      )
      .slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, q, value]);

  // 검색어가 바뀌면 하이라이트를 첫 항목으로 초기화.
  useEffect(() => setHi(0), [q]);

  function add(m: Member) {
    onChange([
      ...value,
      { account: m.account, name: m.name, photo: m.photo ?? null },
    ]);
    setQ("");
  }

  function remove(account: string) {
    onChange(value.filter((p) => p.account !== account));
  }

  // 방향키로 후보 이동, 엔터로 선택, ESC로 검색어 지우기.
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // 한글 IME 조합 확정 중의 Enter(조합확정용)는 무시 — 안 그러면 Enter가 2번 발생해 2개 선택됨.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const m = matches[hi];
      if (m) add(m);
    } else if (e.key === "Escape") {
      setQ("");
    }
  }

  return (
    <div>
      {/* 선택된 참여자 칩 (coral 톤) */}
      {value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {value.map((p) => (
            <span
              key={p.account}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--coral-bg)",
                color: "var(--ink)",
                fontSize: 13,
                fontWeight: 700,
                padding: "4px 10px 4px 4px",
                borderRadius: 20,
              }}
            >
              <Avatar name={p.name} photo={p.photo} size={22} />
              {p.name}
              <button
                onClick={() => remove(p.account)}
                aria-label="참여자 제거"
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: 13,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 검색 입력 (디자인 시스템 tinput) */}
      <input
        className="tinput"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="이름으로 참여자 검색 (↑↓ 이동, Enter 선택)"
      />

      {/* 검색 결과 드롭다운 */}
      {matches.length > 0 && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: 5,
          }}
        >
          {matches.map((m, i) => (
            <button
              key={m.account}
              onClick={() => add(m)}
              onMouseEnter={() => setHi(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                border: "none",
                cursor: "pointer",
                borderRadius: 9,
                padding: 8,
                fontFamily: "inherit",
                background: i === hi ? "var(--coral-bg)" : "transparent",
              }}
            >
              <Avatar name={m.name} photo={m.photo} size={28} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  {m.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.account}
                </div>
              </div>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--coral)",
                }}
              >
                + 추가
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
