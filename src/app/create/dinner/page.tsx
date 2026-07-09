"use client";

// 갑자기 회식 - 설정 화면 (탭탭탭 선택지 UX)
// 인원/예산/분위기를 고르고, 지역을 지정하면 Kakao로 식당을 추천받아 후보로 담습니다.
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Chip } from "@/components/ui";
import StaticMap from "@/components/StaticMap";
import MemberPicker from "@/features/org/MemberPicker";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import type { Participant, PlaceResult } from "@/lib/types";

const BUDGETS = ["3만원 이하", "3~5만원", "5만원 이상"];
const MOODS = [
  "고깃집",
  "술 한잔",
  "조용한 곳",
  "왁자지껄",
  "분위기 좋은",
  "가성비",
  "회 / 해산물",
  "이색적인",
];

// 투표 후보. 검색으로 담은 경우 category/address/placeUrl 이 채워집니다.
interface CandidateInput {
  name: string;
  note: string;
  category?: string;
  address?: string;
  phone?: string;
  placeUrl?: string;
  lat?: number;
  lng?: number;
}

export default function CreateDinnerPage() {
  const router = useRouter();

  const [title, setTitle] = useState("갑자기 회식");
  const [headcount, setHeadcount] = useState(6);
  const [budget, setBudget] = useState(BUDGETS[1]);
  const [moods, setMoods] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [scheduledAt, setScheduledAt] = useState(""); // datetime-local 문자열

  // 지역 검색
  const [region, setRegion] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [searchError, setSearchError] = useState("");
  const [searched, setSearched] = useState(false);
  const [byLocation, setByLocation] = useState(false); // 내 위치 기반 검색 여부

  const [candidates, setCandidates] = useState<CandidateInput[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 로그인한 주최자를 참여자에 기본 포함.
  const { user } = useCurrentUser();
  useEffect(() => {
    if (user?.account) {
      setParticipants((prev) =>
        prev.some((p) => p.account === user.account)
          ? prev
          : [{ account: user.account, name: user.name, photo: user.photo ?? null }, ...prev]
      );
    }
  }, [user]);

  function toggleMood(m: string) {
    setMoods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  // 지역명 또는 좌표(coords)로 검색. coords 가 있으면 내 위치 기반.
  async function runSearch(coords?: { x: string; y: string }) {
    setSearchError("");
    setSearching(true);
    setSearched(true);
    setByLocation(Boolean(coords));
    try {
      const params = new URLSearchParams({ moods: moods.join(",") });
      if (coords) {
        params.set("x", coords.x);
        params.set("y", coords.y);
      } else {
        params.set("region", region.trim());
      }
      const res = await fetch(`/api/places?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "검색 실패");
      setPlaces(data.places ?? []);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "검색에 실패했습니다.");
      setPlaces([]);
    } finally {
      setSearching(false);
    }
  }

  function searchByRegion() {
    if (!region.trim()) {
      setSearchError("지역을 입력하거나 아래 '내 위치로 찾기'를 눌러주세요.");
      return;
    }
    runSearch();
  }

  // 브라우저 위치 권한 → 좌표 → 주변 식당 검색
  function searchByLocation() {
    if (!("geolocation" in navigator)) {
      setSearchError("이 브라우저는 위치 기능을 지원하지 않아요.");
      return;
    }
    setSearchError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        runSearch({
          x: String(pos.coords.longitude),
          y: String(pos.coords.latitude),
        });
      },
      (err) => {
        setLocating(false);
        setSearchError(
          err.code === err.PERMISSION_DENIED
            ? "위치 권한이 거부됐어요. 지역명으로 검색해주세요."
            : "위치를 가져오지 못했어요. 지역명으로 검색해주세요."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function isPicked(p: PlaceResult) {
    return candidates.some((c) => c.placeUrl === p.placeUrl && c.name === p.name);
  }

  function togglePick(p: PlaceResult) {
    setCandidates((prev) => {
      const exists = prev.some(
        (c) => c.placeUrl === p.placeUrl && c.name === p.name
      );
      if (exists) {
        return prev.filter(
          (c) => !(c.placeUrl === p.placeUrl && c.name === p.name)
        );
      }
      return [
        ...prev,
        {
          name: p.name,
          note: p.category,
          category: p.category,
          address: p.address,
          phone: p.phone,
          placeUrl: p.placeUrl,
          lat: p.lat,
          lng: p.lng,
        },
      ];
    });
  }

  function addManual() {
    setCandidates((prev) => [...prev, { name: "", note: "" }]);
  }

  function updateManual(i: number, patch: Partial<CandidateInput>) {
    setCandidates((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    );
  }

  function removeCandidate(i: number) {
    setCandidates((prev) => prev.filter((_, idx) => idx !== i));
  }

  const validCandidates = candidates.filter((c) => c.name.trim());

  async function handleSubmit() {
    setError("");
    if (validCandidates.length < 2) {
      setError("후보를 2개 이상 담아주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "갑자기 회식",
          config: { headcount, budget, moods, memo: memo.trim(), scheduledAt },
          participants,
          candidates: validCandidates.map((c) => ({
            name: c.name.trim(),
            meta: {
              note: c.note?.trim() ?? "",
              category: c.category,
              address: c.address,
              phone: c.phone,
              placeUrl: c.placeUrl,
              lat: c.lat,
              lng: c.lng,
              area: region.trim() || undefined,
            },
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "생성에 실패했습니다.");
      }
      const { eventId } = await res.json();
      router.push(`/e/${eventId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <main className="screen px-5 pb-28">
      <header className="flex items-center gap-3 pt-6 pb-4">
        <Link href="/" className="text-2xl text-stone-400">
          ‹
        </Link>
        <h1 className="text-lg font-bold">🍻 갑자기 회식</h1>
      </header>

      <Field label="회식 이름">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 팀 번개 회식"
          className="w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-stone-200 outline-none focus:ring-orange-400"
        />
      </Field>

      <Field label="몇 명이 모이나요?">
        <div className="flex items-center gap-4">
          <Stepper
            value={headcount}
            onChange={(v) => setHeadcount(Math.max(2, Math.min(50, v)))}
          />
          <span className="text-sm text-stone-500">명</span>
        </div>
      </Field>

      <Field label="1인 예산대">
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <Chip key={b} selected={budget === b} onClick={() => setBudget(b)}>
              {b}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="회식 날짜·시간 (선택 — 캘린더 등록에 사용)">
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-stone-200 outline-none focus:ring-orange-400"
        />
      </Field>

      <Field label={`참여자 (${participants.length}명) — 조직도에서 추가`}>
        <MemberPicker value={participants} onChange={setParticipants} />
        <p className="mt-1.5 px-1 text-xs text-stone-400">
          여기서 지정하거나, 발급된 링크로 팀원이 직접 참여할 수 있어요.
        </p>
      </Field>

      <Field label="분위기 (여러 개 선택 가능)">
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Chip
              key={m}
              selected={moods.includes(m)}
              onClick={() => toggleMood(m)}
            >
              {m}
            </Chip>
          ))}
        </div>
      </Field>

      {/* 지역 검색 */}
      <Field label="어느 지역에서 볼까요?">
        <div className="flex gap-2">
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchByRegion()}
            placeholder="예: 강남역, 연남동, 판교"
            className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-stone-200 outline-none focus:ring-orange-400"
          />
          <button
            onClick={searchByRegion}
            disabled={searching || locating}
            className="shrink-0 rounded-xl bg-stone-800 px-4 text-sm font-semibold text-white active:scale-95 disabled:opacity-50"
          >
            {searching && !byLocation ? "검색중" : "맛집 검색"}
          </button>
        </div>

        <button
          onClick={searchByLocation}
          disabled={searching || locating}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-50 py-3 text-sm font-semibold text-orange-600 ring-1 ring-orange-200 active:scale-[0.99] disabled:opacity-50"
        >
          {locating ? "위치 확인 중…" : "📍 내 위치로 주변 맛집 찾기"}
        </button>

        {searchError && (
          <p className="mt-2 text-sm font-medium text-red-500">{searchError}</p>
        )}
      </Field>

      {/* 검색 결과 */}
      {searched && !searchError && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="px-1 text-xs text-stone-400">
            {searching
              ? "카카오에서 찾는 중…"
              : `${byLocation ? "📍 내 주변 " : ""}${places.length}곳 찾았어요 · 후보로 담을 곳을 탭하세요`}
          </p>
          {places.map((p) => {
            const picked = isPicked(p);
            return (
              <div
                key={p.placeUrl + p.name}
                className={`rounded-2xl p-3.5 ring-1 transition ${
                  picked
                    ? "bg-orange-50 ring-orange-300"
                    : "bg-white ring-stone-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <a
                    href={p.placeUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-200"
                    title="카카오맵에서 보기"
                  >
                    <StaticMap lat={p.lat} lng={p.lng} size={72} />
                  </a>
                  <button
                    onClick={() => togglePick(p)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-stone-800">{p.name}</span>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">
                        {p.category}
                      </span>
                      {p.distance && (
                        <span className="text-[11px] text-stone-400">
                          {p.distance}m
                        </span>
                      )}
                    </div>
                    {p.address && (
                      <div className="mt-1 text-[13px] text-stone-500">
                        📍 {p.address}
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => togglePick(p)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
                      picked
                        ? "bg-orange-500 text-white"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {picked ? "담김 ✓" : "담기"}
                  </button>
                </div>
                {p.placeUrl && (
                  <div className="mt-2 flex gap-2">
                    <a
                      href={p.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-stone-100 px-3 py-1.5 text-[12px] font-semibold text-stone-600 active:scale-95"
                    >
                      🗺 지도
                    </a>
                    <a
                      href={p.placeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-stone-100 px-3 py-1.5 text-[12px] font-semibold text-stone-600 active:scale-95"
                    >
                      ⭐ 리뷰
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 담긴 후보 */}
      <Field label={`투표 후보 (${validCandidates.length}개)`}>
        <div className="flex flex-col gap-2">
          {candidates.length === 0 && (
            <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-400">
              위에서 지역을 검색해 담거나, 직접 추가하세요.
            </p>
          )}
          {candidates.map((c, i) => (
            <div key={i} className="rounded-xl bg-white p-3 ring-1 ring-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-orange-500">
                  {i + 1}
                </span>
                <input
                  value={c.name}
                  onChange={(e) => updateManual(i, { name: e.target.value })}
                  placeholder="식당 이름"
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none"
                />
                <button
                  onClick={() => removeCandidate(i)}
                  className="text-stone-300 hover:text-stone-500"
                  aria-label="후보 삭제"
                >
                  ✕
                </button>
              </div>
              {(c.address || c.note) && (
                <div className="mt-1 pl-5 text-[13px] text-stone-500">
                  {c.address ? `📍 ${c.address}` : c.note}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={addManual}
            className="rounded-xl border border-dashed border-stone-300 py-3 text-sm font-medium text-stone-500 hover:border-orange-300 hover:text-orange-500"
          >
            + 직접 추가
          </button>
        </div>
      </Field>

      <Field label="팀원에게 한마디 (선택)">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 금요일 저녁 7시쯤 생각 중이에요!"
          rows={2}
          className="w-full resize-none rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-stone-200 outline-none focus:ring-orange-400"
        />
      </Field>

      {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-stone-200/70 bg-background/95 p-4 backdrop-blur">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? "만드는 중…"
            : `투표 링크 만들기 (후보 ${validCandidates.length}개)`}
        </Button>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <label className="mb-2 block px-1 text-sm font-semibold text-stone-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(value - 1)}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-bold text-stone-600 ring-1 ring-stone-200 active:scale-95"
      >
        −
      </button>
      <span className="w-10 text-center text-2xl font-extrabold tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-bold text-stone-600 ring-1 ring-stone-200 active:scale-95"
      >
        +
      </button>
    </div>
  );
}
