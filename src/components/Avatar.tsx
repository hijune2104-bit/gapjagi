"use client";

// 프로필 아바타. 사진 URL이 있으면 이미지를, 없거나 로딩 실패 시 이름 이니셜을 보여줍니다.
import { useState } from "react";

export default function Avatar({
  name,
  photo,
  size = 28,
}: {
  name: string;
  photo?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const px = `${size}px`;

  if (photo && !broken) {
    // 외부 CDN 이미지라 next/image 대신 순수 img 사용 (CSP/도메인 설정 불필요).
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setBroken(true)}
        style={{ width: px, height: px }}
        className="shrink-0 rounded-full object-cover ring-1 ring-stone-200"
      />
    );
  }

  return (
    <span
      style={{ width: px, height: px }}
      className="flex shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600"
    >
      {name.slice(0, 1)}
    </span>
  );
}
