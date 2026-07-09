-- 갑자기(Gapjagi) 데이터베이스 스키마 (로컬 PostgreSQL)
-- 적용: psql -d gapjagi -f supabase/schema.sql
-- (또는 npm run db:setup)

-- 1) events: 하나의 "갑자기" 이벤트 (= 하나의 공유 링크)
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  module_type text not null default 'dinner',   -- 'dinner' | 'trip' | 'workshop'
  title       text not null,
  config      jsonb not null default '{}'::jsonb, -- 인원/예산/분위기 등 설정값
  status      text not null default 'voting',     -- 'voting' | 'closed' | 'done'
  created_at  timestamptz not null default now()
);

-- 2) candidates: 투표 후보 (식당 등)
create table if not exists candidates (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid not null references events(id) on delete cascade,
  name      text not null,
  meta      jsonb not null default '{}'::jsonb,   -- 주소/가격대/특징 등
  created_at timestamptz not null default now()
);

-- 3) votes: 투표 기록 (로그인 없이 이름만)
create table if not exists votes (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  voter_name   text not null,
  created_at   timestamptz not null default now()
);

-- 4) plans: AI가 생성한 실행 문서
create table if not exists plans (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  content      jsonb not null,   -- { announcement, timeline, checklist, fee_split ... }
  generated_at timestamptz not null default now()
);

create index if not exists idx_candidates_event on candidates(event_id);
create index if not exists idx_votes_event on votes(event_id);
create index if not exists idx_plans_event on plans(event_id);

-- 6) participants: 이벤트 참여자 (생성 시 지정 or 링크로 합류). 조직도 사용자 기준.
create table if not exists participants (
  event_id   uuid not null references events(id) on delete cascade,
  account    text not null,             -- 조직도 account (로그인 아이디)
  name       text not null,
  photo      text,                      -- 프로필 사진 URL
  joined_at  timestamptz not null default now(),
  primary key (event_id, account)
);
create index if not exists idx_participants_event on participants(event_id);

-- 7) availability: 회의 모듈 — 참여자별 가능 시간 슬롯. 한 사람당 한 행(이름 기준).
--    slots 예: ["수-14","수-15","목-11"] (요일-시각 키). 히트맵 집계에 사용.
create table if not exists availability (
  event_id   uuid not null references events(id) on delete cascade,
  voter_name text not null,               -- 응답자 이름 (로그인/게스트 공용)
  account    text,                         -- 로그인 사용자면 account, 게스트면 null
  slots      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (event_id, voter_name)
);
create index if not exists idx_availability_event on availability(event_id);

-- 5) members: 조직도 API에서 동기화한 사용자 (이름·아이디만). 간이 로그인에 사용.
--    아이디(로그인 식별자)는 조직도의 account 값(보통 이메일)을 사용.
create table if not exists members (
  account    text primary key,          -- 로그인 아이디 = OfficeNEXT account
  name       text not null,             -- 사용자 이름
  photo      text,                      -- 프로필 사진 URL (기본 사진이면 null)
  synced_at  timestamptz not null default now()
);
