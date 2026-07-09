// POST /api/meetings — 회의 이벤트 생성 (+참여자 +주최자 가능시간)
import { NextResponse } from "next/server";
import { createMeeting } from "@/features/meeting/queries";
import type { MeetingConfig, Participant } from "@/lib/types";

export const runtime = "nodejs";

interface CreateBody {
  title: string;
  config: MeetingConfig;
  participants?: Participant[];
  creator?: { voterName: string; account?: string | null; slots: string[] };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateBody;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "제목이 필요합니다." }, { status: 400 });
    }
    if (!body.config?.days?.length || !body.config?.hours?.length) {
      return NextResponse.json(
        { error: "회의 시간 그리드 정의가 필요합니다." },
        { status: 400 }
      );
    }
    const { eventId } = await createMeeting({
      title: body.title.trim(),
      config: body.config,
      participants: body.participants ?? [],
      creator: body.creator,
    });
    return NextResponse.json({ eventId }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/meetings]", e);
    return NextResponse.json(
      { error: "회의 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
