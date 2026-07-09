"use client";

// 갑자기 회식 설정 (D-01·D-02·D-03·D-04·D-05) — gapjagi.html 디자인 + 실제 Kakao 검색.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import StaticMap from "@/components/StaticMap";
import MemberPicker from "@/features/org/MemberPicker";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import {
  BUDGETS,
  FOODS,
  PEOPLE,
  REGIONS,
  VIBES,
} from "@/features/event/dinnerOptions";
import type { Participant, PlaceResult } from "@/lib/types";
const COMMENT_TAGS = [
  "룸 예약 확인",
  "전화로 확인함",
  "가성비 좋음",
  "접근성 좋음",
  "직접 가봄",
  "분위기 굿",
];

// D-12 권역별 제휴(AD) 파트너 — 데모용 목업. 검색결과 맨 위에 '광고'로 1곳 노출.
// (실서비스에선 광고 매칭 서버가 권역·메뉴로 파트너를 반환하는 자리)
type AdPartner = {
  emo: string;
  name: string;
  category: string;
  hook: string; // 제휴 혜택 한 줄
  address: string;
  placeUrl: string;
  lat: number;
  lng: number;
};
const AD_PARTNERS: Record<string, AdPartner> = {
  "성수·왕십리": { emo: "🥩", name: "우대갈비 성수직영점", category: "고깃집 · 룸 완비", hook: "예약 시 음료 무한리필", address: "서울 성동구 성수동", placeUrl: "https://map.kakao.com/?q=우대갈비 성수", lat: 37.5445, lng: 127.0557 },
  "강남·역삼": { emo: "🍖", name: "벽제갈비 역삼점", category: "고깃집 · 10인 룸", hook: "10인 룸 확정 예약 가능", address: "서울 강남구 역삼동", placeUrl: "https://map.kakao.com/?q=벽제갈비 역삼", lat: 37.5006, lng: 127.0364 },
  "홍대·합정": { emo: "🔥", name: "연남토마 본점", category: "고깃집 · 단체석", hook: "단체 10% 할인", address: "서울 마포구 연남동", placeUrl: "https://map.kakao.com/?q=연남토마", lat: 37.5602, lng: 126.9255 },
  "판교·정자": { emo: "🐷", name: "금돼지식당 판교점", category: "고깃집 · 주차", hook: "주차 2시간 무료", address: "경기 성남시 분당구", placeUrl: "https://map.kakao.com/?q=금돼지식당 판교", lat: 37.3948, lng: 127.1112 },
};

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

  // 선택 항목 컨테이너 ref (0~5=칩 필드, 6=장소검색). 하나 고르면 다음 항목으로 스크롤.
  const fieldRefs = useRef<Array<HTMLDivElement | null>>([]);
  function pick<T>(setter: (v: T) => void, value: T, idx: number) {
    setter(value);
    // 렌더 후 다음 필드를 화면 중앙으로 부드럽게 이동 (없으면 아무 일도 안 함)
    requestAnimationFrame(() => {
      fieldRefs.current[idx + 1]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

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

  // 붙여넣기 매직 (①) — 단톡방 대화 → 자동 완성
  const [magicText, setMagicText] = useState("");
  const [magicBusy, setMagicBusy] = useState(false);
  const [magicMsg, setMagicMsg] = useState("");
  const [magicError, setMagicError] = useState("");

  const conditionsDone =
    [dateIdx, region, people, budget, food, vibe].filter(
      (v) => v !== null
    ).length;
  const key = (p: PlaceResult) => p.placeUrl + p.name;

  // D-12: 선택한 권역의 제휴 파트너(있으면). 검색결과 맨 위 광고 카드로 노출.
  const adPartner = region ? AD_PARTNERS[region] : null;
  const adPlace: PlaceResult | null = adPartner
    ? {
        name: adPartner.name,
        category: adPartner.category,
        address: adPartner.address,
        phone: "",
        placeUrl: adPartner.placeUrl,
        lat: adPartner.lat,
        lng: adPartner.lng,
        distance: "",
      }
    : null;

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

  // 후보 카드 한 장 렌더 (실제 검색결과 + 제휴 광고 공용).
  // isAd=true 면 썸네일 대신 이모지, 'AD · 제휴' 배지 + 혜택 문구를 붙인다.
  function placeCard(p: PlaceResult, ad?: AdPartner) {
    const isAd = Boolean(ad);
    const on = picked.some((x) => key(x) === key(p));
    const ptags = tags[key(p)] ?? [];
    return (
      <div key={key(p)} className={`cand${on ? " picked" : ""}${isAd ? " ad" : ""}`}>
        <div className="row1" style={{ cursor: "pointer" }} onClick={() => togglePick(p)}>
          <div className={`selbox${on ? " on" : ""}`}>{on ? "✓" : ""}</div>
          {isAd ? (
            <div className="ph">{ad!.emo}</div>
          ) : (
            <StaticMap lat={p.lat} lng={p.lng} size={46} className="rounded-[11px] shrink-0" />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isAd && <span className="adbadge">AD · 제휴</span>}
            <h4 style={isAd ? { marginTop: 6 } : undefined}>{p.name}</h4>
            <div className="info">
              <span>{p.category}</span>
              {p.distance && <span>{p.distance}m</span>}
            </div>
          </div>
        </div>
        {isAd && <div className="adhook">🎁 {ad!.hook}</div>}
        <a
          href={p.placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12.5, fontWeight: 700, color: "var(--coral-d)", display: "inline-block", marginTop: 9 }}
        >
          🗺 지도·리뷰 ›
        </a>
        {on && (
          <div className="tagwrap">
            <div className="taglabel">메모 남기기 (선택 · 투표 시 함께 보여요)</div>
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

  // 붙여넣기 매직: 파싱 → 칩 채우기 → Kakao 검색 → 후보 3곳 자동 담기 → 투표 생성
  async function magicFill() {
    const text = magicText.trim();
    if (!text || magicBusy) return;
    setMagicError("");
    setMagicBusy(true);
    try {
      setMagicMsg("대화를 읽는 중…");
      const dates = dateOpts.map((d) => d.label);
      const pr = await fetch("/api/parse-dinner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, dates }),
      });
      if (!pr.ok) throw new Error("대화 분석에 실패했어요.");
      const { parsed } = await pr.json();

      // 빈 곳은 기본값으로 채워 데모가 끝까지 흐르게 함
      const eff = {
        region: (parsed.region as string) ?? "강남·역삼",
        food: (parsed.food as string) ?? "고기",
        people: (parsed.people as string) ?? "8명",
        budget: (parsed.budget as string) ?? "3만원대",
        vibe: parsed.vibe as string | null,
      };
      // 화면에 채워지는 게 보이도록 상태 반영
      if (parsed.dateOffset != null) setDateIdx(parsed.dateOffset);
      setRegion(eff.region);
      setFood(eff.food);
      setPeople(eff.people);
      setBudget(eff.budget);
      if (eff.vibe) setVibe(eff.vibe);

      setMagicMsg(`${eff.region} · ${eff.food} 맛집 찾는 중…`);
      const moods = [eff.food, eff.vibe].filter(Boolean).join(",");
      const sr = await fetch(
        `/api/places?${new URLSearchParams({ region: eff.region, moods })}`
      );
      const sdata = await sr.json();
      const found: PlaceResult[] = sdata.places ?? [];
      setSearched(true);
      setByLocation(false);
      setSearchError("");
      setPlaces(found);

      if (found.length < 2) {
        setMagicMsg("");
        setMagicError("맛집이 충분히 안 나왔어요. 아래에서 직접 골라주세요.");
        return;
      }
      const picks = found.slice(0, 3);
      setPicked(picks);

      setMagicMsg("투표 링크 만드는 중…");
      const cr = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `갑자기 회식 · ${eff.region}`,
          config: {
            headcount: parsePeople(eff.people),
            budget: eff.budget,
            moods: [eff.food, eff.vibe].filter(Boolean),
            memo: (parsed.memo as string) ?? "",
            scheduledAt:
              parsed.dateOffset != null ? dateOpts[parsed.dateOffset].iso : "",
            region: eff.region,
          },
          participants,
          candidates: picks.map((p) => ({
            name: p.name,
            meta: {
              category: p.category,
              address: p.address,
              phone: p.phone,
              placeUrl: p.placeUrl,
              lat: p.lat,
              lng: p.lng,
              area: eff.region,
              tags: [],
            },
          })),
        }),
      });
      if (!cr.ok) throw new Error("투표 생성에 실패했어요.");
      const { eventId } = await cr.json();
      router.push(`/e/${eventId}`);
    } catch (e) {
      setMagicMsg("");
      setMagicError(e instanceof Error ? e.message : "자동 완성에 실패했어요.");
      setMagicBusy(false);
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
      {/* ✨ 붙여넣기 매직 — 단톡방 대화 붙여넣으면 자동 완성 */}
      <div className="cardbox" style={{ borderColor: "var(--coral)", background: "#FFF6F2" }}>
        <h3>✨ 붙여넣기 매직</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, margin: "4px 0 10px" }}>
          단톡방 대화를 그대로 붙여넣으면 인원·메뉴·날짜·권역을 알아서 채우고 투표 링크까지 만들어요.
        </p>
        <textarea
          className="tinput"
          style={{ minHeight: 82, resize: "vertical", fontFamily: "inherit" }}
          value={magicText}
          onChange={(e) => setMagicText(e.target.value)}
          placeholder={'예: "오늘 저녁 회식할까? 10명 정도, 강남에서 고기 어때. 조용한 룸으로"'}
          disabled={magicBusy}
        />
        <button
          className="cta"
          style={{ marginTop: 10, fontSize: 15, padding: 13 }}
          onClick={magicFill}
          disabled={!magicText.trim() || magicBusy}
        >
          {magicBusy ? magicMsg || "채우는 중…" : "✨ 붙여넣고 자동 완성"}
        </button>
        {magicError && (
          <p style={{ color: "var(--coral-d)", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
            {magicError}
          </p>
        )}
      </div>

      <p className="helper" style={{ textAlign: "center", margin: "18px 0 6px" }}>
        또는 아래에서 직접 골라보세요 ↓
      </p>

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

      <ChipField label="날짜" fieldRef={(el) => { fieldRefs.current[0] = el; }}>
        {dateOpts.map((d, i) => (
          <Chip key={d.label} on={dateIdx === i} onClick={() => pick(setDateIdx, i, 0)}>
            {d.label}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="지역 권역" fieldRef={(el) => { fieldRefs.current[1] = el; }}>
        {REGIONS.map((r) => (
          <Chip key={r} on={region === r} onClick={() => pick(setRegion, r, 1)}>
            {r}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="인원" fieldRef={(el) => { fieldRefs.current[2] = el; }}>
        {PEOPLE.map((p) => (
          <Chip key={p} on={people === p} onClick={() => pick(setPeople, p, 2)}>
            {p}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="예산 (1인)" fieldRef={(el) => { fieldRefs.current[3] = el; }}>
        {BUDGETS.map((b) => (
          <Chip key={b} on={budget === b} onClick={() => pick(setBudget, b, 3)}>
            {b}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="메뉴" fieldRef={(el) => { fieldRefs.current[4] = el; }}>
        {FOODS.map((f) => (
          <Chip key={f} on={food === f} onClick={() => pick(setFood, f, 4)}>
            {f}
          </Chip>
        ))}
      </ChipField>
      <ChipField label="분위기" fieldRef={(el) => { fieldRefs.current[5] = el; }}>
        {VIBES.map((v) => (
          <Chip key={v} on={vibe === v} onClick={() => pick(setVibe, v, 5)}>
            {v}
          </Chip>
        ))}
      </ChipField>

      <div className="field">
        <label>참여자 ({participants.length}명)</label>
        <MemberPicker value={participants} onChange={setParticipants} />
      </div>

      {/* 장소 검색 (D-03) — 분위기(idx 5) 선택 후 이 지점으로 스크롤 */}
      <div className="field" ref={(el) => { fieldRefs.current[6] = el; }}>
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

      {/* 검색 결과 (D-04 선택 · D-05 메모태그 · D-12 제휴 광고) */}
      {searched && !searchError && (
        <>
          <div className="livebar">
            <span>선택 {picked.length}곳</span>
            <span style={{ marginLeft: "auto" }}>
              {searching ? "찾는 중…" : "탭해서 담기"}
            </span>
          </div>
          {/* 권역 제휴 파트너 광고 (맨 위 1곳) */}
          {adPlace && adPartner && placeCard(adPlace, adPartner)}
          {places.map((p) => placeCard(p))}
          {adPlace && adPartner && (
            <div className="addisclosure">
              &lsquo;AD · 제휴&rsquo; 식당은 {region}권 광고 파트너입니다 (룸·단체 예약 정보 제공)
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

function ChipField({
  label,
  children,
  fieldRef,
}: {
  label: string;
  children: React.ReactNode;
  fieldRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="field" ref={fieldRef}>
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
