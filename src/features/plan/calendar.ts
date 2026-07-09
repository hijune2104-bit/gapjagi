// 캘린더 등록 헬퍼 (클라이언트에서 사용). 외부 인증 없이 동작합니다.
// - 구글 캘린더: 일정 생성 화면을 미리 채워 여는 템플릿 URL
// - .ics: 아이폰/아웃룩 등 모든 캘린더가 읽는 표준 파일

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  details: string;
  location: string;
}

// 구글 캘린더 템플릿 URL 은 UTC 시각을 'YYYYMMDDTHHMMSSZ' 형식으로 받습니다.
function toGoogleUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildGoogleCalendarUrl(ev: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${toGoogleUTC(ev.start)}/${toGoogleUTC(ev.end)}`,
    details: ev.details,
    location: ev.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// .ics 파일에서 개행은 CRLF, 쉼표/세미콜론/역슬래시는 이스케이프해야 합니다.
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildIcs(ev: CalendarEvent): string {
  const stamp = toGoogleUTC(ev.start);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//gapjagi//dinner//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    // uid 는 랜덤 대신 시작시각+제목 기반으로 결정 (동일 일정 재생성 시 중복 방지)
    `UID:gapjagi-${stamp}-${escapeICS(ev.title)}`,
    `DTSTAMP:${toGoogleUTC(ev.start)}`,
    `DTSTART:${toGoogleUTC(ev.start)}`,
    `DTEND:${toGoogleUTC(ev.end)}`,
    `SUMMARY:${escapeICS(ev.title)}`,
    `DESCRIPTION:${escapeICS(ev.details)}`,
    `LOCATION:${escapeICS(ev.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

// 브라우저에서 .ics 파일 다운로드를 트리거합니다.
export function downloadIcs(ev: CalendarEvent, filename = "gapjagi.ics") {
  const blob = new Blob([buildIcs(ev)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
