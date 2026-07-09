// 이벤트 관리 목록
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface EventSummary {
  id: string;
  module_type: string;
  title: string;
  status: string;
  created_at: string;
  candidate_count: number;
  vote_count: number;
  voter_count: number;
}

const statusLabel: Record<string, string> = { voting: "투표중", closed: "마감", done: "완료" };
const moduleLabel: Record<string, string> = { dinner: "회식", trip: "여행", workshop: "워크샵" };

const filters = [
  { label: "전체", value: "" },
  { label: "투표중", value: "voting" },
  { label: "마감", value: "closed" },
  { label: "완료", value: "done" },
];

export default function EventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/events${qs}`)
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false); });
  }, [filter]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" 이벤트를 삭제하시겠습니까?\n후보, 투표, 플랜이 모두 삭제됩니다.`)) return;
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    if (res.ok) setEvents((prev) => prev.filter((e) => e.id !== id));
    else alert("삭제 실패");
  }

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    }
  }

  return (
    <>
      <div className="adm-header">
        <h1>이벤트 관리</h1>
        <div className="adm-header-actions">
          <a href="/api/admin/export?type=events" className="adm-btn ghost" download>CSV 내보내기</a>
        </div>
      </div>

      <div className="adm-filters">
        {filters.map((f) => (
          <button key={f.value} className={`adm-filter-chip${filter === f.value ? " on" : ""}`} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="adm-empty"><p>불러오는 중...</p></div>
      ) : events.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-icon">📅</div>
          <p>이벤트가 없습니다.</p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>모듈</th>
                <th>후보</th>
                <th>투표수</th>
                <th>투표자</th>
                <th>상태</th>
                <th>생성일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 700 }}>
                    <Link href={`/admin/events/${e.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {e.title}
                    </Link>
                  </td>
                  <td><span className="adm-badge basic">{moduleLabel[e.module_type] ?? e.module_type}</span></td>
                  <td style={{ textAlign: "center" }}>{e.candidate_count}</td>
                  <td style={{ textAlign: "center" }}>{e.vote_count}</td>
                  <td style={{ textAlign: "center" }}>{e.voter_count}</td>
                  <td>
                    <select
                      className="adm-select"
                      style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
                      value={e.status}
                      onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                    >
                      <option value="voting">투표중</option>
                      <option value="closed">마감</option>
                      <option value="done">완료</option>
                    </select>
                  </td>
                  <td style={{ color: "#83828b", fontSize: 13 }}>
                    {new Date(e.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Link href={`/admin/events/${e.id}`} className="adm-btn ghost sm">상세</Link>
                      <button className="adm-btn danger sm" onClick={() => handleDelete(e.id, e.title)}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
