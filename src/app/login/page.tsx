"use client";

// 간이 로그인 — 아이디(계정)를 입력하면 로그인.
// (해커톤용: 비밀번호 없음. 신원만 localStorage 에 저장.)
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { setSession } from "@/features/auth/session";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [idInput, setIdInput] = useState("");
  const [error, setError] = useState("");

  async function loginById() {
    const account = idInput.trim();
    if (!account) return;
    setError("");
    try {
      const res = await fetch(
        `/api/org/members/${encodeURIComponent(account)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "로그인 실패");
      setSession(data.member);
      router.push(redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인에 실패했어요.");
    }
  }

  return (
    <main className="screen px-5 pb-10">
      <header className="pt-12 pb-6">
        <h1 className="text-2xl font-extrabold">로그인</h1>
        <p className="mt-1 text-sm text-stone-500">
          아이디(계정)를 입력하세요.
        </p>
      </header>

      <div className="flex gap-2">
        <input
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loginById()}
          placeholder="아이디 입력 (예: hong@jiran.com)"
          autoCapitalize="none"
          className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-stone-200 outline-none focus:ring-orange-400"
        />
        <button
          onClick={loginById}
          className="shrink-0 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white active:scale-95"
        >
          로그인
        </button>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}

      <div className="mt-auto pt-8 text-center">
        <Link href="/" className="text-sm font-medium text-stone-400">
          로그인 없이 둘러보기
        </Link>
      </div>
    </main>
  );
}
