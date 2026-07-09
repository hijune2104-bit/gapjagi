"use client";

import "./admin.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const nav = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/events", label: "이벤트 관리", icon: "📅" },
  { href: "/admin/members", label: "멤버 관리", icon: "👥" },
  { href: "/admin/partners", label: "광고 파트너", icon: "🏢" },
  { href: "/admin/contracts", label: "광고 계약", icon: "📋" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

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
          <Link href="/" className="adm-nav-item">
            ← 서비스로 돌아가기
          </Link>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
