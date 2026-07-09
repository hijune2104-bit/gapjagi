-- 광고 파트너 & 계약 스키마
-- 적용: psql -d gapjagi -f db/ad_schema.sql

-- 1) ad_partners: 광고를 희망하는 업체 (식당, 여행지, 워크샵 장소 등)
create table if not exists ad_partners (
  id             uuid primary key default gen_random_uuid(),
  business_name  text not null,
  category       text not null default 'restaurant',  -- 'restaurant' | 'travel' | 'venue'
  contact_name   text,
  contact_phone  text,
  contact_email  text,
  description    text,
  address        text,
  region         text,                                 -- 권역 (성수, 강남, 제주 등)
  lat            double precision,
  lng            double precision,
  place_url      text,
  photo_url      text,
  status         text not null default 'pending',      -- 'pending' | 'approved' | 'rejected' | 'paused'
  created_at     timestamptz not null default now()
);

-- 2) ad_contracts: 광고 계약 (파트너 1개에 계약 여러 건 가능)
create table if not exists ad_contracts (
  id           uuid primary key default gen_random_uuid(),
  partner_id   uuid not null references ad_partners(id) on delete cascade,
  module_type  text not null default 'dinner',         -- 노출 대상 모듈: 'dinner' | 'trip' | 'workshop'
  plan_type    text not null default 'basic',          -- 'basic' | 'premium' | 'vip'
  monthly_fee  integer not null default 0,             -- 월 광고비 (원)
  start_date   date not null,
  end_date     date not null,
  priority     integer not null default 5,             -- 노출 우선순위 (1=최상위, 10=최하위)
  status       text not null default 'active',         -- 'active' | 'paused' | 'expired' | 'cancelled'
  memo         text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_ad_partners_status on ad_partners(status);
create index if not exists idx_ad_contracts_partner on ad_contracts(partner_id);
create index if not exists idx_ad_contracts_status on ad_contracts(status);
create index if not exists idx_ad_contracts_dates on ad_contracts(start_date, end_date);
