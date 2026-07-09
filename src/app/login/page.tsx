"use client";

// 간이 로그인 — 아이디(계정)를 입력하면 로그인. (해커톤용: 비밀번호 없음)
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { setSession } from "@/features/auth/session";

// useSearchParams() 는 Suspense 경계 안에서만 프리렌더가 허용되므로,
// 로직을 내부 컴포넌트로 분리하고 아래 export 에서 <Suspense> 로 감쌉니다.
function LoginInner() {
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
    <Shell
      cta={
        <button className="cta" onClick={loginById} disabled={!idInput.trim()}>
          로그인
        </button>
      }
    >
      <div className="kicker">갑자기</div>
      <h1 className="title">로그인</h1>
      <p className="sub">조직도 계정(아이디)을 입력하세요.</p>

      <div className="field" style={{ marginTop: 26 }}>
        <label>아이디 (계정)</label>
        <input
          className="tinput"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loginById()}
          placeholder="예: hong@jiran.com"
          autoCapitalize="none"
        />
        {error && (
          <p style={{ color: "var(--coral-d)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
            {error}
          </p>
        )}
      </div>
    </Shell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="helper" style={{ marginTop: 40, textAlign: "center" }}>
            불러오는 중…
          </p>
        </Shell>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
