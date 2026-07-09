// 간이 로그인 세션 (클라이언트 전용, localStorage 기반).
// 해커톤용 — 비밀번호/서버 세션 없이 조직도 멤버 아이디로만 신원 저장.
"use client";

export interface Session {
  account: string; // 로그인 아이디 (조직도 account)
  name: string;
  photo?: string | null; // 프로필 사진 URL
}

const KEY = "gapjagi:session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
