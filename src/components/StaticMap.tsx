"use client";

// 컨트롤·저작권 텍스트가 없는 '정적 지도 썸네일'.
// OpenStreetMap 래스터 타일 1장을 좌표 중심에 맞춰 잘라 보여주고 핀을 얹습니다.
// (iframe 임베드와 달리 확대버튼/Leaflet 텍스트가 없어 작은 썸네일에 적합.)
import { useState } from "react";

const TILE = 256; // OSM 타일 픽셀 크기

function project(lat: number, lng: number, z: number) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const xtile = Math.floor(x);
  const ytile = Math.floor(y);
  return { xtile, ytile, px: (x - xtile) * TILE, py: (y - ytile) * TILE };
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export default function StaticMap({
  lat,
  lng,
  size = 80,
  zoom = 16,
  className = "",
}: {
  lat: number;
  lng: number;
  size?: number;
  zoom?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const { xtile, ytile, px, py } = project(lat, lng, zoom);
  // 타일이 항상 창을 덮도록 위치를 클램프 (가장자리에서도 회색 틈 없음).
  const left = clamp(size / 2 - px, size - TILE, 0);
  const top = clamp(size / 2 - py, size - TILE, 0);
  const pinX = px + left;
  const pinY = py + top;
  const src = `https://tile.openstreetmap.org/${zoom}/${xtile}/${ytile}.png`;

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative overflow-hidden bg-stone-100 ${className}`}
    >
      {!broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="지도"
          onError={() => setBroken(true)}
          style={{
            position: "absolute",
            left,
            top,
            width: TILE,
            height: TILE,
            maxWidth: "none",
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-stone-300">
          🗺
        </div>
      )}
      {/* 위치 핀 */}
      <span
        style={{ left: pinX, top: pinY }}
        className="absolute -translate-x-1/2 -translate-y-full text-base leading-none drop-shadow"
      >
        📍
      </span>
    </div>
  );
}
