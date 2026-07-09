"use client";

// 현재 로그인 사용자 훅. localStorage 세션을 읽고, 서버에서 최신 프로필(이름·사진)로 갱신.
// (옛 세션에 사진이 없어도 자동으로 채워짐 — 재로그인 불필요.)
import { useEffect, useState } from "react";
import { getSession, setSession, type Session } from "./session";

export function useCurrentUser() {
  const [user, setUser] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    setUser(s);
    setReady(true);

    if (s?.account) {
      fetch(`/api/org/members/${encodeURIComponent(s.account)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.member) {
            const fresh: Session = {
              account: data.member.account,
              name: data.member.name,
              photo: data.member.photo,
            };
            setSession(fresh);
            setUser(fresh);
          }
        })
        .catch(() => {});
    }
  }, []);

  return { user, ready };
}
