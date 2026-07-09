// DB 쿼리 계층 (서버 전용). API Route 에서만 import 합니다.
import { query } from "@/lib/db";
import type {
  CandidateMeta,
  CandidateRow,
  DinnerConfig,
  EventRow,
  ModuleType,
  PlanContent,
  PlanRow,
  TallyItem,
} from "@/lib/types";

// 이벤트 + 후보들을 한 번에 생성합니다. (설정 화면에서 호출)
export async function createEvent(input: {
  moduleType: ModuleType;
  title: string;
  config: DinnerConfig | Record<string, unknown>;
  candidates: { name: string; meta?: CandidateMeta }[];
}): Promise<{ eventId: string }> {
  const [event] = await query<EventRow>(
    `insert into events (module_type, title, config)
     values ($1, $2, $3)
     returning *`,
    [input.moduleType, input.title, JSON.stringify(input.config)]
  );

  // 후보를 순차 삽입 (개수가 적으므로 단순 반복으로 충분)
  for (const c of input.candidates) {
    await query(
      `insert into candidates (event_id, name, meta) values ($1, $2, $3)`,
      [event.id, c.name, JSON.stringify(c.meta ?? {})]
    );
  }

  return { eventId: event.id };
}

export async function getEvent(eventId: string): Promise<EventRow | null> {
  const rows = await query<EventRow>(`select * from events where id = $1`, [
    eventId,
  ]);
  return rows[0] ?? null;
}

export async function getCandidates(
  eventId: string
): Promise<CandidateRow[]> {
  return query<CandidateRow>(
    `select * from candidates where event_id = $1 order by created_at asc`,
    [eventId]
  );
}

// 한 사람이 하나의 후보에 투표. 같은 이름이 다시 투표하면 기존 표를 교체합니다.
export async function castVote(input: {
  eventId: string;
  candidateId: string;
  voterName: string;
}): Promise<void> {
  await query(
    `delete from votes where event_id = $1 and voter_name = $2`,
    [input.eventId, input.voterName]
  );
  await query(
    `insert into votes (event_id, candidate_id, voter_name) values ($1, $2, $3)`,
    [input.eventId, input.candidateId, input.voterName]
  );
}

// 후보별 득표 집계 + 투표자 명단(프로필 사진 포함) (2차 결과 화면 폴링용)
export async function getTallies(eventId: string): Promise<TallyItem[]> {
  const candidates = await getCandidates(eventId);
  const votes = await query<{ candidate_id: string; voter_name: string }>(
    `select candidate_id, voter_name from votes where event_id = $1 order by created_at asc`,
    [eventId]
  );

  // 투표자 이름 → 프로필 사진 매핑 (조직도 members 에서 이름으로 조회).
  const names = [...new Set(votes.map((v) => v.voter_name))];
  const photoByName = new Map<string, string | null>();
  if (names.length > 0) {
    const rows = await query<{ name: string; photo: string | null }>(
      `select name, photo from members where name = any($1)`,
      [names]
    );
    for (const r of rows) {
      if (!photoByName.has(r.name)) photoByName.set(r.name, r.photo);
    }
  }

  return candidates.map((candidate) => {
    const voters = votes
      .filter((v) => v.candidate_id === candidate.id)
      .map((v) => ({
        name: v.voter_name,
        photo: photoByName.get(v.voter_name) ?? null,
      }));
    return { candidate, votes: voters.length, voters };
  });
}

// 총 투표 인원 수 (중복 이름 제거)
export async function getVoterCount(eventId: string): Promise<number> {
  const rows = await query<{ n: string }>(
    `select count(distinct voter_name)::int as n from votes where event_id = $1`,
    [eventId]
  );
  return Number(rows[0]?.n ?? 0);
}

export async function savePlan(
  eventId: string,
  content: PlanContent
): Promise<PlanRow> {
  const [plan] = await query<PlanRow>(
    `insert into plans (event_id, content) values ($1, $2) returning *`,
    [eventId, JSON.stringify(content)]
  );
  return plan;
}

// 가장 최근에 생성된 플랜 (없으면 null)
export async function getLatestPlan(
  eventId: string
): Promise<PlanRow | null> {
  const rows = await query<PlanRow>(
    `select * from plans where event_id = $1 order by generated_at desc limit 1`,
    [eventId]
  );
  return rows[0] ?? null;
}
