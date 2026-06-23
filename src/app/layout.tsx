import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "플롯윅스 — 작품 구상 워크스페이스",
  description:
    "세계관 · 인물 · 떡밥 · 콘티를 한 곳에서. 창작자를 위한 작품 구상 도구.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
