import type { Metadata } from "next";
import "./globals.css";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: "국내 공장 인허가 대시보드",
  description: "투자조건에 따라 공장 인허가 절차, 담당기관, 법적 근거와 부분 일정을 탐색하는 의사결정 지원 도구",
  openGraph: {
    title: "국내 공장 인허가 대시보드",
    description: "공장 투자조건을 기관별 인허가 경로와 공식 근거, 부분 일정으로 연결합니다.",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "공장과 인허가 절차 흐름을 표현한 대시보드 이미지" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "국내 공장 인허가 대시보드",
    description: "투자조건별 공장 인허가 경로와 공식 근거를 한눈에 확인합니다.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
