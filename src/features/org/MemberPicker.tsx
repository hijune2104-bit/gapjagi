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
      {/* 선택된 참여자 칩 */}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((p) => (
            <span
              key={p.account}
              className="flex items-center gap-1.5 rounded-full bg-orange-50 py-0.5 pl-0.5 pr-2 text-sm text-stone-700 ring-1 ring-orange-200"
            >
              <Avatar name={p.name} photo={p.photo} size={22} />
              {p.name}
              <button
                onClick={() => remove(p.account)}
                className="ml-0.5 text-stone-400 hover:text-stone-600"
                aria-label="참여자 제거"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 검색 입력 */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="이름으로 참여자 검색 (↑↓ 이동, Enter 선택)"
        className="w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-stone-200 outline-none focus:ring-orange-400"
      />

      {/* 검색 결과 드롭다운 */}
      {matches.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 rounded-xl bg-white p-1 ring-1 ring-stone-200">
          {matches.map((m, i) => (
            <button
              key={m.account}
              onClick={() => add(m)}
              onMouseEnter={() => setHi(i)}
              className={`flex items-center gap-2.5 rounded-lg p-2 text-left ${
                i === hi ? "bg-orange-50" : "hover:bg-stone-50"
              }`}
            >
              <Avatar name={m.name} photo={m.photo} size={28} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-stone-800">
                  {m.name}
                </div>
                <div className="truncate text-xs text-stone-400">
                  {m.account}
                </div>
              </div>
              <span className="ml-auto text-xs font-bold text-orange-500">
                + 추가
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
