// 회의 모듈 DB 쿼리 계층 (서버 전용). /api/meetings/* 에서만 import.
import { query } from "@/lib/db";
import { addParticipants } from "@/features/event/queries";
import type {
  MeetingConfig,
  MeetingConfirmation,
  MeetingResponder,
  Participant,
} from "@/lib/types";

// 회의 이벤트 생성 (+ 참여자, + 주최자 본인 가능시간).
export async function createMeeting(input: {
  title: string;
  config: MeetingConfig;
  participants?: Participant[];
  creator?: { voterName: string; account?: string | null; slots: string[] };
}): Promise<{ eventId: string }> {
  const [event] = await query<{ id: string }>(
    `insert into events (module_type, title, config)
     values ('meeting', $1, $2) returning id`,
    [input.title, JSON.stringify(input.config)]
  );
  if (input.participants?.length) {
    await addParticipants(event.id, input.participants);
  }
  if (input.creator?.voterName?.trim()) {
    await upsertAvailability(
      event.id,
      input.creator.voterName.trim(),
      input.creator.account ?? null,
      input.creator.slots ?? []
    );
  }
  return { eventId: event.id };
}

// 한 사람의 가능 시간 저장/갱신 (같은 이름이면 덮어씀).
export async function upsertAvailability(
  eventId: string,
  voterName: string,
  account: string | null,
  slots: string[]
): Promise<void> {
  await query(
    `insert into availability (event_id, voter_name, account, slots)
     values ($1, $2, $3, $4)
     on conflict (event_id, voter_name) do update
       set slots = excluded.slots, account = excluded.account, updated_at = now()`,
    [eventId, voterName, account, JSON.stringify(slots)]
  );
}

// 모든 응답자의 가능 시간 (히트맵 집계용). slots 는 jsonb → JS 배열로 파싱됨.
export async function listAvailability(
  eventId: string
): Promise<MeetingResponder[]> {
  return query<MeetingResponder>(
    `select voter_name, account, slots
     from availability where event_id = $1 order by updated_at asc`,
    [eventId]
  );
}

// 확정 저장 (plans 재사용) + 이벤트 상태 done 처리.
export async function saveMeetingConfirmation(
  eventId: string,
  c: MeetingConfirmation
): Promise<void> {
  await query(`insert into plans (event_id, content) values ($1, $2)`, [
    eventId,
    JSON.stringify(c),
  ]);
  await query(`update events set status = 'done' where id = $1`, [eventId]);
}

// 가장 최근 확정 (없으면 null).
export async function getMeetingConfirmation(
  eventId: string
): Promise<MeetingConfirmation | null> {
  const rows = await query<{ content: MeetingConfirmation }>(
    `select content from plans where event_id = $1 order by generated_at desc limit 1`,
    [eventId]
  );
  const c = rows[0]?.content;
  return c && c.kind === "meeting" ? c : null;
}
