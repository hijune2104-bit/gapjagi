// 멤버(조직도) 관리
"use client";

import { useEffect, useState } from "react";

interface Member {
  account: string;
  name: string;
  photo: string | null;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newAccount, setNewAccount] = useState("");
  const [newName, setNewName] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((data) => { setMembers(data); setLoading(false); });
  }, []);

  const filtered = search
    ? members.filter((m) => m.name.includes(search) || m.account.includes(search))
    : members;

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/org/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        alert(`동기화 완료: ${data.count ?? 0}명`);
        // 목록 새로고침
        const membersRes = await fetch("/api/admin/members");
        setMembers(await membersRes.json());
      } else {
        alert("동기화 실패");
      }
    } catch {
      alert("동기화 실패");
    }
    setSyncing(false);
  }

  async function handleAdd() {
    if (!newAccount.trim() || !newName.trim()) return;
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: newAccount.trim(), name: newName.trim() }),
    });
    if (res.ok) {
      const member = await res.json();
      setMembers((prev) => {
        const exists = prev.findIndex((m) => m.account === member.account);
        if (exists >= 0) {
          const next = [...prev];
          next[exists] = member;
          return next;
        }
        return [...prev, member];
      });
      setNewAccount("");
      setNewName("");
      setShowAdd(false);
    }
  }

  async function handleDelete(account: string, name: string) {
    if (!confirm(`"${name}" (${account}) 멤버를 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/members/${encodeURIComponent(account)}`, { method: "DELETE" });
    if (res.ok) setMembers((prev) => prev.filter((m) => m.account !== account));
    else alert("삭제 실패");
  }

  return (
    <>
      <div className="adm-header">
        <h1>멤버 관리</h1>
        <div className="adm-header-actions">
          <button className="adm-btn ghost" onClick={handleSync} disabled={syncing}>
            {syncing ? "동기화 중..." : "조직도 동기화"}
          </button>
          <button className="adm-btn primary" onClick={() => setShowAdd(!showAdd)}>
            + 멤버 추가
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="adm-form" style={{ marginBottom: 20, maxWidth: "100%" }}>
          <div className="adm-row">
            <div className="adm-field">
              <label>아이디 (account)</label>
              <input className="adm-input" value={newAccount} onChange={(e) => setNewAccount(e.target.value)} placeholder="예: hong@company.com" />
            </div>
            <div className="adm-field">
              <label>이름</label>
              <input className="adm-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="예: 홍길동" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="adm-btn primary sm" onClick={handleAdd}>추가</button>
            <button className="adm-btn ghost sm" onClick={() => setShowAdd(false)}>취소</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <input
          className="adm-input"
          placeholder="이름 또는 아이디로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div className="adm-stat" style={{ display: "inline-block", marginBottom: 16 }}>
        <div className="adm-stat-label">전체 멤버</div>
        <div className="adm-stat-value">{members.length}명</div>
      </div>

      {loading ? (
        <div className="adm-empty"><p>불러오는 중...</p></div>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty-icon">👥</div>
          <p>{search ? "검색 결과가 없습니다." : "멤버가 없습니다. 조직도를 동기화하세요."}</p>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>아이디 (account)</th>
                <th>프로필</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.account}>
                  <td style={{ fontWeight: 700 }}>{m.name}</td>
                  <td style={{ color: "#83828b", fontSize: 13 }}>{m.account}</td>
                  <td>
                    {m.photo ? (
                      <img src={m.photo} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: "#b7b5ae", fontSize: 12 }}>없음</span>
                    )}
                  </td>
                  <td>
                    <button className="adm-btn danger sm" onClick={() => handleDelete(m.account, m.name)}>삭제</button>
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
