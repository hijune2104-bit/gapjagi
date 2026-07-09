"use client";

// 갑자기 회식 설정 (D-01·D-02·D-03·D-04·D-05) — gapjagi.html 디자인 + 실제 Kakao 검색.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import StaticMap from "@/components/StaticMap";
import MemberPicker from "@/features/org/MemberPicker";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import type { Participant, PlaceResult } from "@/lib/types";

const REGIONS = ["성수·왕십리", "강남·역삼", "홍대·합정", "판교·정자"];
const PEOPLE = ["4명", "6명", "8명", "10명", "12명+"];
const BUDGETS = ["1만원대", "2만원대", "3만원대", "4만원+"];
const FOODS = ["고기", "해산물", "한식", "양식", "일식", "아무거나"];
const VIBES = ["조용한 룸", "왁자지껄", "술 위주", "밥 위주"];
const COMMENT_TAGS = [
  "룸 예약 확인",
  "전화로 확인함",
  "가성비 좋음",
  "접근성 좋음",
  "직접 가봄",
  "분위기 굿",
];

// 오늘 기준 7일 날짜 칩 (시간 제외, D-02)
function useDateOptions() {
  return useMemo(() => {
    const wd = ["일", "월", "화", "수", "목", "금", "토"];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(now);
      dt.setDate(now.getDate() + i);
      const label =
        i === 0 ? "오늘" : i === 1 ? "내일" : `${dt.getMonth() + 1}/${dt.getDate()}(${wd[dt.getDay()]})`;
      dt.setHours(19, 0, 0, 0); // 회식 기본 시간 19:00
      const pad = (n: number) => String(n).padStart(2, "0");
      const iso = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T19:00`;
      return { label, iso };
    });
  }, []);
}

function parsePeople(p: string | null): number {
  if (!p) return 6;
  return parseInt(p, 10) || 6;
}

export default function CreateDinnerPage() {
  const router = useRouter();
  const dateOpts = useDateOptions();
  const { user } = useCurrentUser();

  const [dateIdx, setDateIdx] = useState<number | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [people, setPeople] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [food, setFood] = useState<string | null>(null);
  const [vibe, setVibe] = useState<string | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  useEffect(() => {
    if (user?.account) {
      setParticipants((prev) =>
        prev.some((p) => p.account === user.account)
          ? prev
          : [{ account: user.account, name: user.name, photo: user.photo ?? null }, ...prev]
      );
    }
  }, [user]);

  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [byLocation, setByLocation] = useState(false);
  const [searchError, setSearchError] = useState("");

  // 선택된 후보(shortlist) + 후보별 메모 태그
  const [picked, setPicked] = useState<PlaceResult[]>([]);
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const conditionsDone =
    [dateIdx, region, people, budget, food, vibe].filter(
      (v) => v !== null
    ).length;
  const key = (p: PlaceResult) => p.placeUrl + p.name;

  async function runSearch(coords?: { x: string; y: string }) {
    setSearchError("");
    setSearching(true);
    setSearched(true);
    setByLocation(Boolean(coords));
    try {
      const moods = [food, vibe].filter(Boolean).join(",");
      const params = new URLSearchParams({ moods });
      if (coords) {
        params.set("x", coords.x);
        params.set("y", coords.y);
      } else {
        params.set("region", region ?? "");
      }
      const res = await fetch(`/api/places?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "검색 실패");
      setPlaces(data.places ?? []);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "검색에 실패했어요.");
      setPlaces([]);
    } finally {
      setSearching(false);
    }
  }

  function searchByLocation() {
    if (!("geolocation" in navigator)) {
      setSearchError("이 브라우저는 위치 기능을 지원하지 않아요.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        runSearch({
          x: String(pos.coords.longitude),
          y: String(pos.coords.latitude),
        });
      },
      () => {
        setLocating(false);
        setSearchError("위치를 가져오지 못했어요. 권역을 골라 검색해주세요.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function togglePick(p: PlaceResult) {
    setPicked((prev) =>
      prev.some((x) => key(x) === key(p))
        ? prev.filter((x) => key(x) !== key(p))
        : [...prev, p]
    );
  }
  function toggleTag(p: PlaceResult, tag: string) {
    const k = key(p);
    setTags((prev) => {
      const arr = prev[k] ?? [];
      return {
        ...prev,
        [k]: arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag],
      };
    });
  }

  async function submit() {
    if (picked.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `갑자기 회식${region ? ` · ${region}` : ""}`,
          config: {
            headcount: parsePeople(people),
            budget: budget ?? "3만원대",
            moods: [food, vibe].filter(Boolean),
            memo: "",
            scheduledAt: dateIdx !== null ? dateOpts[dateIdx].iso : "",
            region: region ?? undefined,
          },
          participants,
          candidates: picked.map((p) => ({
            name: p.name,
            meta: {
              category: p.category,
              address: p.address,
              phone: p.phone,
              placeUrl: p.placeUrl,
              lat: p.lat,
              lng: p.lng,
              area: region ?? undefined,
              tags: tags[key(p)] ?? [],
            },
          })),
        }),
      });
      if (!res.ok) throw new Error();
      const { eventId } = await res.json();
      // D-04: 1곳이면 바로 확정(추천안으로), 2곳+ 이면 팀 투표
      router.push(picked.length === 1 ? `/e/${eventId}/plan` : `/e/${eventId}`);
    } catch {
      setSubmitting(false);
    }
  }

  const cta =
    picked.length === 0 ? (
      <button className="cta" disabled>
        {searched ? "장소를 골라주세요" : "조건 고르고 맛집 검색"}
      </button>
    ) : picked.length === 1 ? (
      <button className="cta" onClick={submit} disabled={submitting}>
        {submitting ? "만드는 중…" : "이 곳으로 확정"}
      </button>
    ) : (
      <button className="cta mint" onClick={submit} disabled={submitting}>
        {submitting ? "만드는 중…" : `🗳️ 팀 투표 붙이기 (${picked.length}곳)`}
      </button>
    );

  return (
    <Shell steps={["선택", "의논", "완성"]} activeStep={0} cta={cta}>
      <div className="qline">
        <span className="dot" />
        {conditionsDone < 6
          ? `아직 ${6 - conditionsDone}개 남았어요`
          : "조건 완성! 맛집 검색해요"}
      </div>
      <h1 className="title" style={{ fontSize: 23 }}>
        회식 조건을
        <br />
        탭탭탭 골라주세요
      </h1>

      <ChipField label="날짜">
        {dateOpts.map((d, i) => (
          <Chip key={d.label} on={dateIdx === i} onClick={() => setDateIdx(i)}>
            {d.label}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="지역 권역">
        {REGIONS.map((r) => (
          <Chip key={r} on={region === r} onClick={() => setRegion(r)}>
            {r}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="인원">
        {PEOPLE.map((p) => (
          <Chip key={p} on={people === p} onClick={() => setPeople(p)}>
            {p}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="예산 (1인)">
        {BUDGETS.map((b) => (
          <Chip key={b} on={budget === b} onClick={() => setBudget(b)}>
            {b}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="메뉴">
        {FOODS.map((f) => (
          <Chip key={f} on={food === f} onClick={() => setFood(f)}>
            {f}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="분위기">
        {VIBES.map((v) => (
          <Chip key={v} on={vibe === v} onClick={() => setVibe(v)}>
            {v}
          </Chip>
        ))}
      </ChipField>

      <div className="field">
        <label>참여자 ({participants.length}명)</label>
        <MemberPicker value={participants} onChange={setParticipants} />
      </div>

      {/* 장소 검색 (D-03) */}
      <div className="field">
        <label>장소 추천받기</label>
        <button
          className="cta"
          style={{ fontSize: 15, padding: 14 }}
          onClick={() => runSearch()}
          disabled={!region || !food || searching || locating}
        >
          {searching && !byLocation
            ? "카카오에서 찾는 중…"
            : region && food
              ? `${region} · ${food} 맛집 검색`
              : "권역·메뉴를 먼저 골라주세요"}
        </button>
        <button
          className="cta ghost"
          style={{ fontSize: 14, padding: 13, marginTop: 8 }}
          onClick={searchByLocation}
          disabled={searching || locating || !food}
        >
          {locating ? "위치 확인 중…" : "📍 내 위치로 주변 맛집"}
        </button>
        {searchError && (
          <p style={{ color: "var(--coral-d)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
            {searchError}
          </p>
        )}
      </div>

      {/* 검색 결과 (D-04 선택 · D-05 메모태그) */}
      {searched && !searchError && (
        <>
          <div className="livebar">
            <span>선택 {picked.length}곳</span>
            <span style={{ marginLeft: "auto" }}>
              {searching ? "찾는 중…" : "탭해서 담기"}
            </span>
          </div>
          {places.map((p) => {
            const on = picked.some((x) => key(x) === key(p));
            const ptags = tags[key(p)] ?? [];
            return (
              <div key={key(p)} className={`cand${on ? " picked" : ""}`}>
                <div
                  className="row1"
                  style={{ cursor: "pointer" }}
                  onClick={() => togglePick(p)}
                >
                  <div className={`selbox${on ? " on" : ""}`}>{on ? "✓" : ""}</div>
                  <StaticMap
                    lat={p.lat}
                    lng={p.lng}
                    size={46}
                    className="rounded-[11px] shrink-0"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4>{p.name}</h4>
                    <div className="info">
                      <span>{p.category}</span>
                      {p.distance && <span>{p.distance}m</span>}
                    </div>
                  </div>
                </div>
                <a
                  href={p.placeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--coral-d)",
                    display: "inline-block",
                    marginTop: 9,
                  }}
                >
                  🗺 지도·리뷰 ›
                </a>
                {on && (
                  <div className="tagwrap">
                    <div className="taglabel">
                      메모 남기기 (선택 · 투표 시 함께 보여요)
                    </div>
                    <div className="chips">
                      {COMMENT_TAGS.map((t) => (
                        <button
                          key={t}
                          className={`chip sm${ptags.includes(t) ? " on" : ""}`}
                          onClick={() => toggleTag(p, t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </Shell>
  );
}

function ChipField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chips">{children}</div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={`chip${on ? " on" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}
