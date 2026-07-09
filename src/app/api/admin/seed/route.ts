// POST /api/admin/seed — 샘플 데이터 생성 (개발용)
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST() {
  try {
    // 1) 광고 테이블 생성 (없으면)
    await query(`
      create table if not exists ad_partners (
        id uuid primary key default gen_random_uuid(),
        business_name text not null,
        category text not null default 'restaurant',
        contact_name text, contact_phone text, contact_email text,
        description text, address text, region text,
        lat double precision, lng double precision,
        place_url text, photo_url text,
        status text not null default 'pending',
        created_at timestamptz not null default now()
      )
    `);
    await query(`
      create table if not exists ad_contracts (
        id uuid primary key default gen_random_uuid(),
        partner_id uuid not null references ad_partners(id) on delete cascade,
        module_type text not null default 'dinner',
        plan_type text not null default 'basic',
        monthly_fee integer not null default 0,
        start_date date not null, end_date date not null,
        priority integer not null default 5,
        status text not null default 'active',
        memo text,
        created_at timestamptz not null default now()
      )
    `);

    // 2) 멤버 샘플
    const members = [
      { account: "hong@company.com", name: "홍길동" },
      { account: "kim@company.com", name: "김철수" },
      { account: "lee@company.com", name: "이영희" },
      { account: "park@company.com", name: "박지민" },
      { account: "choi@company.com", name: "최수진" },
      { account: "jung@company.com", name: "정우성" },
      { account: "kang@company.com", name: "강민지" },
      { account: "yoon@company.com", name: "윤서연" },
    ];
    for (const m of members) {
      await query(
        `insert into members (account, name) values ($1, $2) on conflict (account) do update set name = excluded.name`,
        [m.account, m.name]
      );
    }

    // 3) 이벤트 샘플
    const [ev1] = await query<{ id: string }>(
      `insert into events (module_type, title, config, status)
       values ('dinner', '7월 팀 회식', $1, 'voting') returning id`,
      [JSON.stringify({ headcount: 8, budget: "3~5만원", moods: ["고깃집", "왁자지껄"], scheduledAt: "2026-07-15T19:00", memo: "신입 환영회 겸!" })]
    );
    const [ev2] = await query<{ id: string }>(
      `insert into events (module_type, title, config, status)
       values ('dinner', '디자인팀 점심', $1, 'closed') returning id`,
      [JSON.stringify({ headcount: 5, budget: "2만원 이하", moods: ["조용한", "분위기좋은"] })]
    );
    const [ev3] = await query<{ id: string }>(
      `insert into events (module_type, title, config, status)
       values ('dinner', '6월 전체 회식', $1, 'done') returning id`,
      [JSON.stringify({ headcount: 15, budget: "5만원 이상", moods: ["고깃집", "단체석"], scheduledAt: "2026-06-20T18:30" })]
    );

    // 이벤트1 후보 + 투표
    const cands1 = [
      { name: "숙성도 성수점", meta: { category: "음식점 > 한식 > 육류", address: "서울 성동구 성수이로 88", region: "성수" } },
      { name: "온달집 강남점", meta: { category: "음식점 > 한식 > 육류", address: "서울 강남구 테헤란로 112", region: "강남" } },
      { name: "해물포차 을지로", meta: { category: "음식점 > 해산물", address: "서울 중구 을지로 155", region: "을지로" } },
    ];
    const candIds1: string[] = [];
    for (const c of cands1) {
      const [row] = await query<{ id: string }>(
        `insert into candidates (event_id, name, meta) values ($1, $2, $3) returning id`,
        [ev1.id, c.name, JSON.stringify(c.meta)]
      );
      candIds1.push(row.id);
    }
    // 투표 (숙성도 3표, 온달집 2표, 해물포차 1표)
    const voters1 = [
      { name: "홍길동", candIdx: 0 }, { name: "김철수", candIdx: 0 }, { name: "이영희", candIdx: 0 },
      { name: "박지민", candIdx: 1 }, { name: "최수진", candIdx: 1 },
      { name: "정우성", candIdx: 2 },
    ];
    for (const v of voters1) {
      await query(
        `insert into votes (event_id, candidate_id, voter_name) values ($1, $2, $3)`,
        [ev1.id, candIds1[v.candIdx], v.name]
      );
    }

    // 이벤트2 후보 + 투표
    const cands2 = [
      { name: "스시오마카세 연남", meta: { category: "음식점 > 일식", address: "서울 마포구 연남로 32", region: "연남" } },
      { name: "파스타바 홍대", meta: { category: "음식점 > 양식", address: "서울 마포구 와우산로 55", region: "홍대" } },
    ];
    const candIds2: string[] = [];
    for (const c of cands2) {
      const [row] = await query<{ id: string }>(
        `insert into candidates (event_id, name, meta) values ($1, $2, $3) returning id`,
        [ev2.id, c.name, JSON.stringify(c.meta)]
      );
      candIds2.push(row.id);
    }
    for (const v of [{ name: "강민지", i: 0 }, { name: "윤서연", i: 0 }, { name: "박지민", i: 1 }]) {
      await query(`insert into votes (event_id, candidate_id, voter_name) values ($1, $2, $3)`, [ev2.id, candIds2[v.i], v.name]);
    }

    // 이벤트3 후보 + 투표 + 플랜
    const cands3 = [
      { name: "마포갈매기 본점", meta: { category: "음식점 > 한식 > 육류", address: "서울 마포구 월드컵북로 100", region: "마포" } },
      { name: "팔색삼겹살 종로", meta: { category: "음식점 > 한식 > 육류", address: "서울 종로구 종로 150", region: "종로" } },
    ];
    const candIds3: string[] = [];
    for (const c of cands3) {
      const [row] = await query<{ id: string }>(
        `insert into candidates (event_id, name, meta) values ($1, $2, $3) returning id`,
        [ev3.id, c.name, JSON.stringify(c.meta)]
      );
      candIds3.push(row.id);
    }
    for (const v of [
      { name: "홍길동", i: 0 }, { name: "김철수", i: 0 }, { name: "이영희", i: 0 },
      { name: "박지민", i: 0 }, { name: "최수진", i: 0 },
      { name: "정우성", i: 1 }, { name: "강민지", i: 1 }, { name: "윤서연", i: 1 },
    ]) {
      await query(`insert into votes (event_id, candidate_id, voter_name) values ($1, $2, $3)`, [ev3.id, candIds3[v.i], v.name]);
    }
    // 플랜
    await query(
      `insert into plans (event_id, content) values ($1, $2)`,
      [ev3.id, JSON.stringify({
        announcement: "6월 전체 회식이 확정되었습니다!\n장소: 마포갈매기 본점\n일시: 6/20(금) 18:30\n회비: 1인 45,000원",
        timeline: [
          { time: "18:30", activity: "집합 및 착석" },
          { time: "19:00", activity: "건배 및 식사 시작" },
          { time: "20:30", activity: "2차 이동 (선택)" },
        ],
        checklist: ["예약 확인 전화", "참석 인원 최종 확인", "법인카드 준비", "2차 장소 물색"],
        feeSplit: { perPerson: 45000, total: 675000, note: "15명 x 45,000원 (삼겹살+음료 포함)" },
        reservation: { place: "마포갈매기 본점", tip: "20명 단체석 예약 가능, 2일 전 확인 전화 필수", address: "서울 마포구 월드컵북로 100" },
      })]
    );

    // 4) 광고 파트너 샘플
    const partners = [
      { business_name: "숙성도", category: "restaurant", contact_name: "김사장", contact_phone: "02-1234-5678", contact_email: "contact@suksung.kr", description: "프리미엄 숙성 한우 전문점. 성수/강남/판교 직영 3개점.", address: "서울 성동구 성수이로 88", region: "성수", status: "approved" },
      { business_name: "제주올레리조트", category: "travel", contact_name: "이매니저", contact_phone: "064-789-1234", contact_email: "ad@jejuolle.com", description: "제주 서귀포 해변 리조트. 팀 워크샵 패키지 인기.", address: "제주 서귀포시 중문관광로 72", region: "제주", status: "approved" },
      { business_name: "온달집", category: "restaurant", contact_name: "박대표", contact_phone: "02-555-7890", contact_email: "ondal@email.com", description: "강남 대표 고기집. 회식 예약률 1위.", address: "서울 강남구 테헤란로 112", region: "강남", status: "approved" },
      { business_name: "해운대마린뷰", category: "travel", contact_name: "최팀장", contact_phone: "051-333-4567", description: "해운대 오션뷰 펜션. 워크샵 전용 세미나실 완비.", address: "부산 해운대구 해운대해변로 100", region: "부산", status: "pending" },
      { business_name: "스타트업허브 판교", category: "venue", contact_name: "정실장", contact_phone: "031-222-8899", contact_email: "hub@startup.kr", description: "판교 워크샵/세미나 전용 공간. 빔프로젝터, 화이트보드 무료.", address: "경기 성남시 분당구 판교로 256", region: "판교", status: "approved" },
      { business_name: "포차한잔 을지로", category: "restaurant", contact_name: "한사장", contact_phone: "02-777-1234", description: "을지로 감성 포차. 회식 단체석 30명 가능.", address: "서울 중구 을지로 155", region: "을지로", status: "rejected" },
    ];

    const partnerIds: string[] = [];
    for (const p of partners) {
      const [row] = await query<{ id: string }>(
        `insert into ad_partners (business_name, category, contact_name, contact_phone, contact_email, description, address, region, status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [p.business_name, p.category, p.contact_name, p.contact_phone, p.contact_email ?? null, p.description, p.address, p.region, p.status]
      );
      partnerIds.push(row.id);
    }

    // 5) 광고 계약 샘플
    const contracts = [
      { partnerIdx: 0, module_type: "dinner", plan_type: "vip", monthly_fee: 500000, start_date: "2026-07-01", end_date: "2026-12-31", priority: 1, status: "active", memo: "성수 권역 상단 고정" },
      { partnerIdx: 1, module_type: "trip", plan_type: "premium", monthly_fee: 300000, start_date: "2026-06-01", end_date: "2026-11-30", priority: 2, status: "active", memo: "여행 모듈 오픈 시 상단 노출" },
      { partnerIdx: 2, module_type: "dinner", plan_type: "premium", monthly_fee: 350000, start_date: "2026-07-01", end_date: "2026-09-30", priority: 3, status: "active", memo: "강남 권역 프리미엄" },
      { partnerIdx: 4, module_type: "workshop", plan_type: "basic", monthly_fee: 150000, start_date: "2026-07-01", end_date: "2026-08-31", priority: 5, status: "active", memo: "워크샵 모듈 테스트" },
      { partnerIdx: 0, module_type: "dinner", plan_type: "basic", monthly_fee: 200000, start_date: "2026-01-01", end_date: "2026-06-30", priority: 5, status: "expired", memo: "상반기 계약 (종료)" },
    ];
    for (const c of contracts) {
      await query(
        `insert into ad_contracts (partner_id, module_type, plan_type, monthly_fee, start_date, end_date, priority, status, memo)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [partnerIds[c.partnerIdx], c.module_type, c.plan_type, c.monthly_fee, c.start_date, c.end_date, c.priority, c.status, c.memo]
      );
    }

    return NextResponse.json({ ok: true, message: "샘플 데이터 생성 완료", counts: { members: members.length, events: 3, partners: partners.length, contracts: contracts.length } });
  } catch (e) {
    console.error("[seed]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
