"use client";

// 로그인 상태 표시 위젯 (랜딩 우상단). 로그인 시 아바타 + "이름님 · 로그아웃", 아니면 "로그인".
import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { clearSession } from "./session";
import { useCurrentUser } from "./useCurrentUser";

export default function AuthStatus() {
  const { user, ready } = useCurrentUser();
  const [loggedOut, setLoggedOut] = useState(false);

  if (!ready) return null; // SSR/CSR 불일치 방지

  const session = loggedOut ? null : user;

  if (!session) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 ring-1 ring-stone-200"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <Avatar name={session.name} photo={session.photo} size={28} />
      <span className="font-semibold text-stone-700">{session.name}님</span>
      <button
        onClick={() => {
          clearSession();
          setLoggedOut(true);
        }}
        className="text-stone-400 underline"
      >
        로그아웃
      </button>
    </div>
  );
}
