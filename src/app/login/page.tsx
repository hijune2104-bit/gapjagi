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
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [needName, setNeedName] = useState(false); // 아이디가 DB에 없어 이름 등록이 필요한 상태
  const [busy, setBusy] = useState(false);

  // 아이디를 바꾸면 등록 모드 해제 (다른 아이디를 다시 조회)
  function onIdChange(v: string) {
    setIdInput(v);
    if (needName) setNeedName(false);
    if (error) setError("");
  }

  // 1단계: 아이디로 조회. 있으면 로그인, 없으면 이름 입력 단계로 전환.
  async function loginById() {
    const account = idInput.trim();
    if (!account) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/org/members/${encodeURIComponent(account)}`);
      const data = await res.json();
      if (res.ok) {
        setSession(data.member);
        router.push(redirect);
        return;
      }
      if (res.status === 404) {
        // 처음 오는 사용자 → 이름 입력받아 등록
        setNeedName(true);
      } else {
        setError(data.error ?? "로그인에 실패했어요.");
      }
    } catch {
      setError("로그인에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  // 2단계: 이름과 함께 새 멤버 등록 후 로그인.
  async function registerAndLogin() {
    const account = idInput.trim();
    const name = nameInput.trim();
    if (!account || !name) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/org/members/${encodeURIComponent(account)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "등록에 실패했어요.");
      setSession(data.member);
      router.push(redirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell
      cta={
        needName ? (
          <button
            className="cta"
            onClick={registerAndLogin}
            disabled={!idInput.trim() || !nameInput.trim() || busy}
          >
            {busy ? "저장 중…" : "이름 저장하고 시작하기"}
          </button>
        ) : (
          <button className="cta" onClick={loginById} disabled={!idInput.trim() || busy}>
            {busy ? "확인 중…" : "로그인"}
          </button>
        )
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
          onChange={(e) => onIdChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !needName && loginById()}
          placeholder="예: hong@jiran.com"
          autoCapitalize="none"
          disabled={busy}
        />
        {error && (
          <p style={{ color: "var(--coral-d)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
            {error}
          </p>
        )}
      </div>

      {/* 아이디가 DB에 없을 때: 이름 입력받아 새 멤버로 등록 */}
      {needName && (
        <div className="field">
          <div className="votedbanner" style={{ marginBottom: 12 }}>
            👋 처음 오셨네요! 이름을 입력하면 바로 시작해요.
          </div>
          <label>이름</label>
          <input
            className="tinput"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && registerAndLogin()}
            placeholder="예: 윤슬기"
            autoFocus
          />
        </div>
      )}
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
