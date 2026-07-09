// 로컬 PostgreSQL 연결 풀 (서버 전용).
// 주의: 이 모듈은 Node 런타임에서만 동작합니다 → API Route / Server Component 에서만 import.
//       클라이언트 컴포넌트에서 import 하면 안 됩니다.
import { Pool } from "pg";

// Next.js dev 모드는 파일이 바뀔 때마다 모듈을 다시 로드하므로,
// 전역에 풀을 캐싱해 연결이 계속 새로 생기는 것을 막습니다.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

// 로컬(localhost/127.0.0.1) 이 아니면 클라우드 DB(Neon 등)로 간주해 SSL 을 켭니다.
// Neon/Supabase 는 관리형 인증서라 rejectUnauthorized:false 로 두어도 안전합니다.
const conn = process.env.DATABASE_URL ?? "";
const isLocal = conn.includes("localhost") || conn.includes("127.0.0.1");

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: conn,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

// 서버리스(Vercel)에서는 warm 인스턴스 간 풀을 재사용하는 편이 연결 수 절약에 유리하므로
// dev·prod 모두 전역 캐싱합니다.
globalForPg.pgPool = pool;

// 간단한 쿼리 헬퍼. 제네릭으로 결과 row 타입을 받습니다.
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
