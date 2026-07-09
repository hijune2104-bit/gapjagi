// 이벤트 상세 — 후보/투표/플랜 한눈에 보기
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EventDetail {
  event: {
    id: string;
    module_type: string;
    title: string;
    config: Record<string, unknown>;
    status: string;
    created_at: string;
  };
  candidates: { id: string; name: string; meta: Record<string, unknown> }[];
  participants: { account: string; name: string; photo: string | null }[];
  tallies: { candidate: { id: string; name: string }; votes: number; voters: { name: string }[] }[];
  plan: { content: Record<string, unknown>; generated_at: string } | null;
}

const statusLabel: Record<string, string> = { voting: "투표중", closed: "마감", done: "완료" };

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<EventDetail | null>(null);

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, [id]);

  if (!data) return <div className="adm-empty"><p>불러오는 중...</p></div>;

  const { event, candidates, participants, tallies, plan } = data;
  const config = event.config as Record<string, unknown>;

  async function handleStatusChange(status: string) {
    const res = await fetch(`/api/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setData((d) => d ? { ...d, event: { ...d.event, status } } : d);
  }

  async function handleDelete() {
    if (!confirm("이 이벤트를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/events");
  }

  return (
    <>
      <div className="adm-header">
        <h1>{event.title}</h1>
        <div className="adm-header-actions">
          <select
            className="adm-select"
            style={{ width: "auto", padding: "8px 12px" }}
            value={event.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="voting">투표중</option>
            <option value="closed">마감</option>
            <option value="done">완료</option>
          </select>
          <button className="adm-btn danger" onClick={handleDelete}>삭제</button>
        </div>
      </div>

      <div className="adm-stats">
        <div className="adm-stat">
          <div className="adm-stat-label">상태</div>
          <div className="adm-stat-value">{statusLabel[event.status]}</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">후보 수</div>
          <div className="adm-stat-value">{candidates.length}</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">참여자</div>
          <div className="adm-stat-value">{participants.length}명</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-label">총 투표</div>
          <div className="adm-stat-value coral">{tallies.reduce((s, t) => s + t.votes, 0)}표</div>
        </div>
      </div>

      {/* 설정 정보 */}
      <div className="adm-chart-card">
        <h3>설정 정보</h3>
        <div style={{ fontSize: 14, lineHeight: 1.8 }}>
          {config.headcount != null && <div><strong>인원:</strong> {`${config.headcount}명`}</div>}
          {config.budget != null && <div><strong>예산:</strong> {`${config.budget}`}</div>}
          {Array.isArray(config.moods) && config.moods.length > 0 && (
            <div><strong>분위기:</strong> {`${(config.moods as string[]).join(", ")}`}</div>
          )}
          {config.scheduledAt != null && <div><strong>일시:</strong> {`${config.scheduledAt}`}</div>}
          {config.memo != null && <div><strong>메모:</strong> {`${config.memo}`}</div>}
        </div>
      </div>

      {/* 투표 현황 */}
      <div className="adm-chart-card">
        <h3>투표 현황</h3>
        {tallies.length === 0 ? (
          <p style={{ color: "#83828b", fontSize: 13 }}>후보가 없습니다.</p>
        ) : (
          tallies
            .sort((a, b) => b.votes - a.votes)
            .map((t) => {
              const max = Math.max(...tallies.map((x) => x.votes), 1);
              return (
                <div key={t.candidate.id} className="adm-bar-row">
                  <span className="adm-bar-label">{t.candidate.name}</span>
                  <div className="adm-bar-track">
                    <div className="adm-bar-fill mint" style={{ width: `${(t.votes / max) * 100}%` }} />
                  </div>
                  <span className="adm-bar-value">{t.votes}표</span>
                </div>
              );
            })
        )}
      </div>

      {/* 투표자 목록 */}
      {tallies.some((t) => t.voters.length > 0) && (
        <div className="adm-chart-card">
          <h3>투표자 목록</h3>
          {tallies
            .filter((t) => t.voters.length > 0)
            .map((t) => (
              <div key={t.candidate.id} style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: 13 }}>{t.candidate.name}:</strong>{" "}
                <span style={{ fontSize: 13, color: "#83828b" }}>
                  {t.voters.map((v) => v.name).join(", ")}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* 참여자 */}
      {participants.length > 0 && (
        <div className="adm-chart-card">
          <h3>참여자 ({participants.length}명)</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {participants.map((p) => (
              <span key={p.account} className="adm-badge approved">{p.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* AI 플랜 */}
      {plan && (
        <div className="adm-chart-card">
          <h3>AI 추천안 ({new Date(plan.generated_at).toLocaleString("ko-KR")})</h3>
          <pre style={{ fontSize: 12, whiteSpace: "pre-wrap", color: "#5c5b62", lineHeight: 1.6, background: "#f8f7f4", padding: 12, borderRadius: 8 }}>
            {JSON.stringify(plan.content, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button className="adm-btn ghost" onClick={() => router.back()}>← 목록으로</button>
      </div>
    </>
  );
}
