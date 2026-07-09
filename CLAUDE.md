# 갑자기 (Gapjagi) — 해커톤 프로토타입

> **"갑자기 잡힌 일정, 3분 안에 실행 계획으로"**
> 갑자기 회식·여행·워크샵이 잡혔을 때, 다 같이 투표하고 실행 문서까지 자동으로 뽑아주는 웹 서비스.

이 문서는 프로젝트의 **기준 문서(Source of Truth)** 입니다. 결정이 바뀌면 여기부터 갱신합니다.

---

## 1. 컨셉 & 차별점

상황을 고르면 서비스가 "뭘 정해야 할지" 선택지로 안내 → 링크 공유로 팀 투표 → AI가 실행 문서 자동 생성.

**ChatGPT 대비 차별점**
1. **질문을 대신 설계** — 빈 채팅창이 아니라 탭탭탭 선택지 UX.
2. **혼자가 아닌 팀 투표** — 링크 공유로 여러 명이 의사결정에 참여.
3. **대화가 아닌 '실행 문서'가 결과물** — 공지문·타임라인·체크리스트로 바로 실행.

---

## 2. 현재 상태 (한눈에)

**MVP = 갑자기 회식 모듈. 전체 흐름 완성 + E2E 검증 완료.**

완성됨:
- 랜딩 → 회식 설정(선택지 UX) → 투표지 → 결과(폴링) → 추천안(Groq) → 공유 HTML
- 지역/📍내 위치 기반 Kakao 식당 추천 (리뷰 링크·지도 포함)
- 구글 캘린더 등록 + .ics 저장
- 추천 식당 위치 지도(OpenStreetMap)
- 조직도 API 연동(이름·아이디·프로필사진 동기화) + 간이 로그인(아이디 입력)
- 참여자: 생성 시 조직도에서 지정 + 링크로 "나도 참여" 합류
- 사용자 보이는 곳 프로필 사진 표시 / 도메인별 폴더 구조(`src/features/*`)

미완 (남은 일):
- [ ] 팀 문구/시안 반영 (리스킨 — §9 참고)
- [ ] 여행 / 워크샵 모듈 확장 (`module_type` 재사용)
- [ ] 데모 리허설 / 샘플 데이터 정리

---

## 3. 실행 방법

```bash
# 1) 로컬 PostgreSQL 16 (Homebrew) 이 실행 중이어야 함. 최초 1회만:
createdb gapjagi                 # psql 경로: /opt/homebrew/opt/postgresql@16/bin
npm run db:setup                 # = psql -d gapjagi -f db/schema.sql (테이블 생성)

# 2) .env.local 채우기 (§5)

# 3) 개발 서버
npm run dev                      # http://localhost:3000
```

- **로컬 개발**: 이 기기(localhost)에서 구동. 팀 공유용으로 Vercel에 배포됨(아래 §3-1).
- 모바일 화면 확인: 브라우저 개발자도구(⌥⌘I) → 기기 모드.

### 3-1. 배포 (Vercel + Neon) — 팀원 공유용

**라이브 URL: https://gapjagi.vercel.app** (Vercel CLI 로 배포. 팀원에게 이 링크만 공유하면 됨)

구성: **앱 = Vercel(무료 Hobby)** / **DB = Neon(무료 Postgres)**. 둘 다 무료 티어. GitHub push 자동배포는 미설정 상태라, 재배포는 아래 CLI 로 수동 실행.

```bash
# (최초 1회) Vercel 로그인 — 브라우저 인증. 현재 계정: sulki0309-6269
npx vercel login

# (최초 1회) 프로젝트 연결 — .vercel/project.json 생성 (projectName: gapjagi)
npx vercel link --yes --project gapjagi

# (최초 1회) Neon DB 준비: neon.tech 에서 프로젝트 생성 → 접속문자열 받기
#   스키마 로드 (로컬 psql 로 Neon 에 직접):
psql "postgresql://<neon-접속문자열>?sslmode=require" -f db/schema.sql
#   멤버는 배포 후 첫 /api/org/members 호출 시 샘플 8명 자동 시딩됨.

# (최초 1회) 환경변수 3개를 production 에 등록 (값은 .env.local 에서 복사)
printf '%s' "<Neon POOLED 접속문자열>"    | npx vercel env add DATABASE_URL production
printf '%s' "$GROQ_API_KEY"               | npx vercel env add GROQ_API_KEY production
printf '%s' "$KAKAO_REST_API_KEY"         | npx vercel env add KAKAO_REST_API_KEY production
#   ⚠️ OFFICENEXT_* 는 등록하지 않는다 → 실 직원 대신 샘플 8명으로 폴백(개인정보 노출 0).

# 배포 (코드 수정 후 매번 이 한 줄) — 로컬 디렉터리를 업로드해 Vercel 에서 빌드
npx vercel --prod --yes
```

배포 시 반드시 지켜야 할 포인트:
- **DB SSL**: `src/lib/db.ts` 는 접속문자열이 localhost 가 아니면 SSL 을 자동으로 켠다(Neon 필수). 이 처리가 없으면 클라우드 DB 연결이 거부됨.
- **Neon 은 POOLED 접속문자열**(호스트에 `-pooler` 포함)을 `DATABASE_URL` 로 쓴다 — 서버리스 연결 수 절약.
- **동기화 타임아웃 회피**: 조직도 1082명 실동기화는 10~20초라 Vercel 서버리스 함수 시간제한을 넘길 수 있음. 그래서 배포판은 `OFFICENEXT_*` 를 비워 **샘플 8명**만 쓴다. (실 직원 데이터가 필요하면 로컬에서 `db/seed-members.sql` 을 Neon 에 직접 import — 단 실명·사진이라 **public repo 커밋 금지**, `.gitignore` 처리됨.)
- **Kakao 도메인 등록 불필요**: 식당 검색은 서버(API Route)에서 REST 키로 호출하므로 JS 키용 도메인 제한을 받지 않는다. (클라이언트 JS 키였다면 배포 도메인 등록 필요.)
- **빌드 주의**: `useSearchParams()` 는 반드시 `<Suspense>` 로 감싼다(프로덕션 빌드 프리렌더에서 강제. 로컬 dev 는 안 걸림).
- **샘플 로그인 계정**(비밀번호 없음, 아이디만 입력): `hong@jiran.com`·`kim@jiran.com`·`lee@jiran.com`·`park@jiran.com`·`choi@jiran.com`·`jung@jiran.com`·`kang@jiran.com`·`yoon@jiran.com`. 게스트 닉네임도 가능.
- **공개 노출 주의**: 배포 앱은 URL 만 알면 누구나 접속 가능(인증계층 없음). 그래서 개인정보는 샘플만. 저장소는 아직 PUBLIC. 데모 후 Neon 비밀번호·Groq·Kakao 키 **rotate 권장**.

---

## 4. 기술 스택

| 영역 | 선택 | 메모 |
|------|------|------|
| 프레임워크 | **Next.js 16 (App Router) + TypeScript** | 페이지·공유링크·API 라우트를 한 프로젝트에서 |
| 스타일 | **Tailwind CSS v4** | 모바일 우선 |
| 데이터 | **로컬 PostgreSQL 16** (`pg` 드라이버) | DB 접근은 **모두 서버(API Route)** 경유 |
| 실시간 | **폴링(polling)** | 2차 결과 화면이 2초마다 재조회 (Supabase Realtime 대체) |
| AI 생성 | **Groq API** (`groq-sdk`, `openai/gpt-oss-120b`) | 투표 결과 → 실행 문서. OpenAI 호환, 매우 빠름(~2초) |
| 장소 검색 | **Kakao Local API** (키워드검색, `FD6`=음식점) | 지역/좌표 기반 식당 추천 |
| 지도 | **OpenStreetMap 임베드** (`MiniMap`) | 무인증 iframe + 마커 |
| 캘린더 | **구글 캘린더 템플릿 URL + .ics** | 무인증. 일정 생성 화면 프리필 |

> **핵심 원칙 — DB 접근 위치**: `pg` 드라이버는 Node 서버에서만 동작. 클라이언트 컴포넌트에서 `src/lib/db.ts`를 import 하면 안 되고, 모든 쿼리는 **API Route(`app/api/*`)** 또는 Server Component 에서만 실행.

---

## 5. 환경변수 & 보안

`.env.local` (git 제외됨):
```
DATABASE_URL=postgresql://yoonseulki@localhost:5432/gapjagi
GROQ_API_KEY=            # 서버 전용
KAKAO_REST_API_KEY=      # 서버 전용 (Kakao Developers > 앱 > REST API 키)
OFFICENEXT_BASE_URL=https://api.officenext.net
OFFICENEXT_CLIENT_ID=    # 조직도 API. 비우면 샘플 데이터로 폴백
OFFICENEXT_CLIENT_SECRET=
```

- 모든 키는 **서버 전용**. `NEXT_PUBLIC_` 접두사를 붙이면 클라이언트로 노출됨.
- `.env.local`은 커밋 금지. `.env.example`은 빈 템플릿(커밋 가능).
- 채팅으로 공유된 키(Groq·Kakao·OfficeNEXT Client Secret)는 데모 후 **재발급(rotate)** 권장.
- **Kakao 주의**: 앱에서 "카카오맵(로컬)" 제품을 ON 해야 검색 허용됨 (`OPEN_MAP_AND_LOCAL`). Web 플랫폼에 `http://localhost:3000` 등록 필요.

---

## 6. 사용자 흐름 (회식 모듈)

| 단계 | 화면 | 하는 일 |
|------|------|---------|
| 랜딩 | `/` | 상황 3종 선택 (회식 활성 / 여행·워크샵 "곧") |
| 설정 | `/create/dinner` | 인원·예산·분위기·**회식 일시**·**참여자(조직도 검색)** 선택 → 지역/📍내 위치 → Kakao 식당 추천(지도·리뷰링크) → 후보 담기 → 링크 발급 |
| ① 투표지 | `/e/[id]` | 공유링크 복사 + **참여자 목록/나도 참여** + 이름 입력 + 후보 선택 투표 |
| ② 결과 | `/e/[id]/result` | 2초 폴링 실시간 막대그래프, 1위 강조 |
| ③ 추천안 | `/e/[id]/plan` | Groq 생성 공지문·회비·타임라인·체크리스트 + 지도 + **구글 캘린더/·ics** |
| 공유 | `/e/[id]/share` | 읽기 전용 예쁜 HTML (링크복사·공유·인쇄) |

---

## 7. 파일 & 라우팅 구조

**도메인/기능별 폴더 구조**: 화면·API는 `src/app`, 공용 기반은 `src/lib`, 도메인 로직은 `src/features/<도메인>`, 공용 UI는 `src/components`.

```
src/app/                            (라우트)
  page.tsx                          랜딩 (+ 로그인 상태 위젯)
  login/page.tsx                    간이 로그인 (멤버 선택 / 아이디 입력)
  create/dinner/page.tsx            회식 설정 (선택지 UX + 검색 + 지도)
  e/[eventId]/page.tsx              ① 투표지 (로그인 이름 자동 채움)
  e/[eventId]/result/page.tsx       ② 결과 (폴링)
  e/[eventId]/plan/page.tsx         ③ 추천안 (Groq + 캘린더)
  e/[eventId]/share/page.tsx        공유 HTML (서버 컴포넌트) + ShareBar.tsx
  api/events/...                    이벤트/후보/투표/집계/플랜 (CRUD + Groq)
  api/events/[id]/join/route.ts     POST 로그인 사용자를 참여자로 합류
  api/places/route.ts               Kakao 식당 검색 (region 또는 x,y 좌표)
  api/org/sync/route.ts             POST 조직도 동기화 (members 저장)
  api/org/members/route.ts          GET 멤버 목록 (비었으면 자동 동기화)
  api/org/members/[account]/route.ts GET 아이디(account)로 멤버 조회 (로그인 검증)

src/lib/                            (공용 기반)
  db.ts         pg 연결 풀 + query 헬퍼 (서버 전용)
  types.ts      공용 타입

src/features/                       (도메인 로직)
  event/queries.ts                  이벤트/후보/투표/집계/플랜 CRUD (서버 전용)
  place/kakao.ts                    Kakao Local 검색 (분위기→키워드, 지역/좌표)
  plan/groq.ts                      투표 결과 → 실행 문서 생성 (JSON 강제 + 폴백)
  plan/calendar.ts                  구글 캘린더 URL + .ics 생성 (클라이언트용)
  org/client.ts                     OfficeNEXT 조직도 API (토큰→조회, 샘플 폴백)
  org/queries.ts                    members 테이블 CRUD (서버 전용)
  org/MemberPicker.tsx              조직도 멤버 검색·선택 위젯 (참여자 지정, 클라이언트)
  auth/session.ts                   간이 로그인 세션 (localStorage, 클라이언트)
  auth/AuthStatus.tsx               로그인 상태 위젯 (아바타 + 이름님, 클라이언트)

src/components/
  ui.tsx         Button/Chip/Card/StepBar 등 공용 UI (리스킨 지점)
  MiniMap.tsx    OSM 임베드 지도(인터랙티브, 공유 페이지 큰 지도용)
  StaticMap.tsx  OSM 타일 정적 지도 썸네일 (컨트롤·텍스트 없음, 목록/추천안용)
  Avatar.tsx     프로필 사진 (실패/없으면 이름 이니셜 폴백)

db/schema.sql   테이블 5종 DDL (events/candidates/votes/plans/members)
```

---

## 8. 데이터 모델 (`db/schema.sql`)

```
events        id · module_type('dinner'|'trip'|'workshop') · title
              · config(jsonb) · status('voting'|'closed'|'done') · created_at
candidates    id · event_id → events · name · meta(jsonb) · created_at
votes         id · event_id · candidate_id · voter_name(로그인없이 이름만) · created_at
plans         id · event_id · content(jsonb) · generated_at
members       account(로그인 아이디=조직도 account) · name · photo(프로필 URL) · synced_at   -- 조직도 동기화, 간이 로그인용
participants  event_id · account · name · photo · joined_at   -- 이벤트 참여자(생성 시 지정 or 링크 합류), PK(event_id,account)
```

**config (DinnerConfig)**: `headcount`(인원) · `budget`(예산대) · `moods[]`(분위기 태그) · `memo` · `scheduledAt`(회식 일시, 캘린더용).

**candidate.meta (CandidateMeta)**: `note` · `category`(카카오 카테고리) · `address` · `phone` · `placeUrl`(카카오맵 리뷰 링크) · `lat`/`lng`(지도용) · `area`.

**plan.content (PlanContent)**: `announcement`(공지문) · `timeline[]`(시각·활동) · `checklist[]` · `feeSplit`(1인/총액/근거) · `reservation`(place·tip·address·placeUrl·lat·lng).

> 로컬 데모라 인증/권한 계층 없음. 모든 접근은 서버 API 경유, 브라우저는 DB 직접 접근 불가. (실서비스 전환 시 인증·권한 필요 — 별개 과제)

---

## 9. 리스킨 가이드 (팀 디자인·문구 반영 지점)

기능은 그대로 두고 겉모습만 바꿀 때 손대는 곳:
- **브랜드 색**: `src/app/globals.css` 의 `--color-brand` 한 줄 (현재 오렌지 `#f97316`).
- **버튼/칩/카드/단계바 스타일**: `src/components/ui.tsx`.
- **문구**: 각 페이지의 한국어 텍스트 (랜딩 `page.tsx`, 설정/투표/결과/추천안/공유).
- 현재 팔레트는 오렌지 계열 + stone 중립색, 모바일 `max-w-md` 컨테이너(`.screen`).

---

## 10. 외부 연동 특이사항

- **Groq**: JSON 응답 강제(`response_format: json_object`) + 파싱 실패 시 폴백 문서 반환. 확정 장소는 AI 표현 대신 실제 후보 데이터로 덮어써 정확도 보장(캘린더 장소).
- **Kakao Local**: ⚠️ 평점(★)·리뷰 본문은 API 미제공 → 카카오맵 상세 링크(`place_url`)로 리뷰 연결. 분위기 칩을 검색 키워드로 변환(예: 고깃집→고기집). 좌표(x=경도,y=위도) 주면 거리순 검색.
- **캘린더**: 시각은 UTC(`YYYYMMDDTHHMMSSZ`)로 변환해 URL/ics 생성 (KST 19:00 → 10:00Z 검증됨).
- **지도**: 무인증 OpenStreetMap. 작은 썸네일(검색결과·추천안)은 컨트롤/저작권 텍스트가 없는 **정적 타일 지도**(`StaticMap`), 공유 페이지 큰 지도는 인터랙티브 임베드(`MiniMap`). 각 지도/썸네일은 카카오맵 상세(`place_url`)로 이동하는 "🗺 지도" 버튼과 연결. 한글 표기가 약함 → 필요 시 Kakao 지도(JS 키)로 교체 가능.
- **프로필 사진**: 사용자가 보이는 모든 곳(랜딩 로그인 위젯·투표 화면·결과 투표자 목록)에 `Avatar` 표시. 조직도 `profile_photo_url`(공개 접근) 사용, 없거나 로드 실패 시 이름 이니셜 폴백. 결과 화면 투표자 사진은 `voter_name`을 `members.name`으로 매칭해 조회.
- **조직도(OfficeNEXT)**: OAuth2 Client Credentials → `GET /api/jiranfamily/organization`. 응답 ~2MB라 동기화에 10~20초(외부 네트워크). `users[]`에서 **{account, name}만** 추출해 `members`에 벌크 저장 (아이디 = account, 보통 이메일. account 없는 항목은 로그인 불가라 제외). 실연동 검증 완료(실 멤버 1082명). 크레덴셜 없으면 샘플 8명 폴백. **한 번 동기화 후에는 로컬 조회라 로그인 즉시.**
- **로그인**: 해커톤용 간이 방식. 비밀번호·서버세션 없이 `members`의 아이디(account) 선택/입력 → `localStorage`(`gapjagi:session`)에 {account,name} 저장. 투표 화면이 이 이름을 자동 사용.

---

## 11. 작업 규칙

- 응답·주석·커밋 메시지는 **한국어**, 식별자(변수/함수)는 영어.
- 코드 인용 시 "이름 + 무엇을 하는지" 한 문장으로 설명 (바이브코딩 모드).
- 커밋/푸시는 사용자가 요청할 때만.
- 비밀키는 서버 전용, 클라이언트 노출 금지.
