import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "갑자기 — 3분 안에 실행 계획으로",
  description:
    "갑자기 잡힌 회식·여행·워크샵, 다 같이 투표하고 실행 문서까지 자동으로.",
};

// 모바일 우선 서비스라 뷰포트를 고정합니다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF5A32",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
