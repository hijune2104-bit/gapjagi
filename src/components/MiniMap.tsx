// 키 없이 동작하는 간단한 지도 (OpenStreetMap 임베드 + 마커).
// 서버/클라이언트 어디서든 쓸 수 있는 순수 iframe 입니다.

export default function MiniMap({
  lat,
  lng,
  className = "",
  delta = 0.004, // 지도 확대 범위(작을수록 확대)
}: {
  lat: number;
  lng: number;
  className?: string;
  delta?: number;
}) {
  if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta]
    .map((n) => n.toFixed(6))
    .join("%2C");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <iframe
      title="지도"
      src={src}
      loading="lazy"
      className={`border-0 ${className}`}
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
