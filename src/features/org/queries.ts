// 로컬 members 테이블 CRUD (서버 전용). 조직도에서 동기화한 {account, name}.
// 아이디(로그인 식별자) = account (보통 이메일).
import { query } from "@/lib/db";

export interface Member {
  account: string;
  name: string;
  photo?: string | null; // 프로필 사진 URL (없으면 null)
}

// 조직도 사용자 목록을 members 에 벌크 upsert. 이름이 바뀌면 갱신.
// 1000명 이상을 한 번의 INSERT로 처리 (개별 쿼리 대비 훨씬 빠름).
export async function upsertMembers(members: Member[]): Promise<void> {
  if (members.length === 0) return;

  // 같은 배치 안에 중복 account 가 있으면 ON CONFLICT가 실패하므로 먼저 제거.
  const unique = Array.from(
    new Map(members.map((m) => [m.account, m])).values()
  );

  // Postgres 파라미터 상한(65535)을 고려해 배치로 나눠 삽입.
  const CHUNK = 1000; // 행당 3개 파라미터 → 3000개, 안전
  for (let i = 0; i < unique.length; i += CHUNK) {
    const slice = unique.slice(i, i + CHUNK);
    const values = slice
      .map((_, j) => `($${j * 3 + 1}, $${j * 3 + 2}, $${j * 3 + 3}, now())`)
      .join(",");
    const params = slice.flatMap((m) => [m.account, m.name, m.photo ?? null]);
    await query(
      `insert into members (account, name, photo, synced_at)
       values ${values}
       on conflict (account) do update
         set name = excluded.name, photo = excluded.photo, synced_at = now()`,
      params
    );
  }
}

export async function listMembers(): Promise<Member[]> {
  return query<Member>(
    `select account, name, photo from members order by name asc`
  );
}

export async function getMember(account: string): Promise<Member | null> {
  const rows = await query<Member>(
    `select account, name, photo from members where account = $1`,
    [account]
  );
  return rows[0] ?? null;
}

export async function countMembers(): Promise<number> {
  const rows = await query<{ n: string }>(`select count(*)::int as n from members`);
  return Number(rows[0]?.n ?? 0);
}

// ── Admin 전용 ──

export async function deleteMember(account: string): Promise<boolean> {
  const rows = await query<{ account: string }>(
    `delete from members where account = $1 returning account`,
    [account]
  );
  return rows.length > 0;
}

export async function updateMember(
  account: string,
  input: { name?: string; photo?: string | null }
): Promise<Member | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (input.name !== undefined) {
    params.push(input.name);
    sets.push(`name = $${params.length}`);
  }
  if (input.photo !== undefined) {
    params.push(input.photo);
    sets.push(`photo = $${params.length}`);
  }
  if (sets.length === 0) return getMember(account);
  params.push(account);
  const rows = await query<Member>(
    `update members set ${sets.join(", ")} where account = $${params.length} returning account, name, photo`,
    params
  );
  return rows[0] ?? null;
}

export async function createMember(input: {
  account: string;
  name: string;
  photo?: string | null;
}): Promise<Member> {
  const [row] = await query<Member>(
    `insert into members (account, name, photo) values ($1, $2, $3)
     on conflict (account) do update set name = excluded.name, photo = excluded.photo
     returning account, name, photo`,
    [input.account, input.name, input.photo ?? null]
  );
  return row;
}
