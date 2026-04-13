import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "개인회생 서식 자동화 시스템",
  description: "채권 단위로 사건을 구조화하고 계산/검증을 자동화하는 법률 엔진 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
