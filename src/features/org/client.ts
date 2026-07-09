// OfficeNEXT 지란지교패밀리 조직도 조회 API 연동 (서버 전용).
// 문서: docs/references/jiranfamily-organization-api-reference.pdf
//
// 흐름: OAuth2 Client Credentials 로 토큰 발급 → 조직도 조회 → users[]에서 {id, name}만 추출.
// 크레덴셜(env)이 없으면 가이드의 샘플 데이터로 폴백해 데모가 동작하도록 합니다.
import { upsertMembers, type Member } from "./queries";

const BASE_URL = process.env.OFFICENEXT_BASE_URL ?? "https://api.officenext.net";

// 크레덴셜 없을 때 쓰는 샘플 사용자 (로그인 데모용). account(아이디) + name + photo.
const SAMPLE_USERS: Member[] = [
  { account: "hong@jiran.com", name: "홍길동", photo: null },
  { account: "kim@jiran.com", name: "김지훈", photo: null },
  { account: "lee@jiran.com", name: "이수진", photo: null },
  { account: "park@jiran.com", name: "박서연", photo: null },
  { account: "choi@jiran.com", name: "최민준", photo: null },
  { account: "jung@jiran.com", name: "정하늘", photo: null },
  { account: "kang@jiran.com", name: "강도윤", photo: null },
  { account: "yoon@jiran.com", name: "윤채원", photo: null },
];

interface OrgUser {
  id: number;
  account: string | null;
  name: string;
  profile_photo_url: string | null;
  is_use_default_photo?: boolean;
}
interface OrgResponse {
  users?: OrgUser[];
}

// OAuth2 Client Credentials 로 Access Token 발급.
async function getAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "*",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`토큰 발급 실패 ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// 조직도 전체 조회 후 활성 사용자만 반환.
async function fetchOrganizationUsers(token: string): Promise<OrgUser[]> {
  const res = await fetch(`${BASE_URL}/api/jiranfamily/organization`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`조직도 조회 실패 ${res.status}: ${body}`);
  }
  const data = (await res.json()) as OrgResponse;
  return data.users ?? [];
}

export interface SyncResult {
  count: number;
  source: "api" | "sample";
}

// 조직도를 동기화해 로컬 members 에 {id, name} 저장. 반환: 저장 개수 + 데이터 출처.
export async function syncMembers(): Promise<SyncResult> {
  const clientId = process.env.OFFICENEXT_CLIENT_ID;
  const clientSecret = process.env.OFFICENEXT_CLIENT_SECRET;

  let members: Member[];
  let source: SyncResult["source"];

  if (clientId && clientSecret) {
    const token = await getAccessToken(clientId, clientSecret);
    const orgUsers = await fetchOrganizationUsers(token);
    // account(아이디)·이름·프로필사진만 남긴다. account 없는 항목은 로그인 불가라 제외.
    members = orgUsers
      .filter((u) => u.account && u.account.trim())
      .map((u) => ({
        account: u.account!.trim(),
        name: u.name,
        // 기본 사진이면 저장하지 않고 이니셜로 대체.
        photo: u.is_use_default_photo ? null : u.profile_photo_url || null,
      }));
    source = "api";
  } else {
    members = SAMPLE_USERS;
    source = "sample";
  }

  await upsertMembers(members);
  return { count: members.length, source };
}
