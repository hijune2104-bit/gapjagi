// POST /api/events — 이벤트 + 후보 생성
import { NextResponse } from "next/server";
import { createEvent } from "@/features/event/queries";
import type { CandidateMeta, DinnerConfig, Participant } from "@/lib/types";

export const runtime = "nodejs"; // pg 드라이버는 Node 런타임 필요

interface CreateBody {
  title: string;
  config: DinnerConfig;
  candidates: { name: string; meta?: CandidateMeta }[];
  participants?: Participant[];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBody;

    // 최소 검증
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "제목이 필요합니다." }, { status: 400 });
    }
    const candidates = (body.candidates ?? []).filter((c) => c.name?.trim());
    if (candidates.length < 2) {
      return NextResponse.json(
        { error: "후보를 2개 이상 입력해주세요." },
        { status: 400 }
      );
    }

    const { eventId } = await createEvent({
      moduleType: "dinner",
      title: body.title.trim(),
      config: body.config ?? {},
      candidates,
      participants: body.participants ?? [],
    });

    return NextResponse.json({ eventId }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/events]", e);
    return NextResponse.json(
      { error: "이벤트 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
