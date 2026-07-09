"use client";

import "./admin.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const nav = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/events", label: "이벤트 관리", icon: "📅" },
  { href: "/admin/members", label: "멤버 관리", icon: "👥" },
  { href: "/admin/partners", label: "광고 파트너", icon: "🏢" },
  { href: "/admin/contracts", label: "광고 계약", icon: "📋" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null); // null=확인중
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  // 쿠키 기반 인증 확인 (대시보드 API 호출로 체크)
  useEffect(() => {
    fetch("/api/admin/auth/check")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      setAuthed(true);
    } else {
      setError("비밀번호가 틀렸습니다.");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthed(false);
    setPw("");
  }

  // 로딩 중
  if (authed === null) {
    return (
      <div className="adm">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <p style={{ color: "#83828b" }}>확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 화면
  if (!authed) {
    return (
      <div className="adm">
        <div className="adm-login">
          <div className="adm-login-card">
            <div className="adm-logo" style={{ justifyContent: "center", marginBottom: 24 }}>
              <span className="adm-logo-mark">갑</span>
              <span>자기 Admin</span>
            </div>
            <form onSubmit={handleLogin}>
              <div className="adm-field">
                <label>관리자 비밀번호</label>
                <input
                  className="adm-input"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  autoFocus
                />
              </div>
              {error && <p style={{ color: "#a32d2d", fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button type="submit" className="adm-btn primary" style={{ width: "100%" }}>
                로그인
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-logo">
          <span className="adm-logo-mark">갑</span>
          <span>자기 Admin</span>
        </div>
        <nav className="adm-nav">
          {nav.map((n) => {
            const active =
              n.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`adm-nav-item${active ? " on" : ""}`}
              >
                <span className="adm-nav-icon">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="adm-side-foot">
          <button className="adm-nav-item" onClick={handleLogout}>
            로그아웃
          </button>
          <Link href="/" className="adm-nav-item">
            ← 서비스로 돌아가기
          </Link>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
