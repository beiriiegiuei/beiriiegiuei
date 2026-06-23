# 플롯윅스 (Plotwerks)

소설 · 웹툰 · 웹소설 · 애니 · 드라마 등 **작품 구상**을 한 곳에서 빠르게 정리하는 워크스페이스입니다.
노션·삼성노트처럼 정보가 흩어지고 페이지를 왔다 갔다 하는 노가다 대신, 구상에 필요한 도구를 한 화면 흐름 안에 모았습니다.

## ✨ 핵심 기능

| 기능 | 설명 |
| --- | --- |
| 🧑 **인물 카드 + 관계도** | 이름·이명·소속·속성·랭킹·등급·생존상태·MBTI·태그까지 정리하고, 드래그 가능한 SVG 관계도로 인물 간 관계를 시각화 |
| 🛡️ **세력 · 조직** | 길드·가문·국가 등 세력을 속성·수장·소속원·산하 구조로 관리하고, 세력 간 관계(동맹·적대·산하)까지 정리 |
| 🎣 **떡밥 추적기** | 복선을 등록하고 "심은 회차 → 회수 회차"로 연결, 회수율을 한눈에 추적 |
| 🎬 **스토리 구조** | 시즌 → 아크(시나리오) → 회차의 계층 구조. 아크별 회차 범위, 회차 번호, 드래그앤드롭으로 흐름 구성 |
| 📚 **세계관 위키** | 카테고리별 문서 + 경량 마크다운 + `[[문서명]]` 백링크로 설정 연결 |

디자인은 **미니멀 & 밝음** 톤(따뜻한 중성 + 보랏빛 액센트)으로 가독성에 집중했습니다.

## 🛠 기술 스택

- **Next.js 15** (App Router, Server Actions) + **React 19** + **TypeScript**
- **Prisma + SQLite** — 외부 DB 없이 파일 하나로 동작하는 서버 DB
- **Tailwind CSS** — 자체 디자인 토큰 기반 미니멀 UI

## 🚀 시작하기

```bash
cp .env.example .env # DATABASE_URL 설정 (file:./dev.db)
npm install          # 의존성 설치 (+ prisma generate 자동 실행)
npm run db:push      # SQLite 스키마 생성
npm run db:seed      # (선택) 데모 작품 "끝나지 않는 겨울" 데이터 삽입
npm run dev          # http://localhost:3000
```

배포용 빌드:

```bash
npm run build
npm start
```

## 🗂 데이터 모델

`Project`(작품) 하위에 `Character`·`Relationship`·`Foreshadow`·`Act`·`Scene`·`WikiPage`가 속합니다.
전체 스키마는 [`prisma/schema.prisma`](prisma/schema.prisma) 참고.

## 📁 폴더 구조

```
src/
  app/
    page.tsx                    # 작품 목록(홈)
    projects/[id]/
      layout.tsx                # 사이드바 + 작품 셸
      page.tsx                  # 개요(대시보드)
      characters/               # 인물 카드 + 관계도
      foreshadowing/            # 떡밥 추적기
      board/                    # 콘티 보드 (칸반)
      wiki/                     # 세계관 위키
  components/                   # Modal, 아이콘 등 공용 UI
  lib/db.ts                     # Prisma 클라이언트
prisma/                         # schema + seed
```

## 🧭 다음 단계 아이디어

- 사용자 로그인 + 멀티 기기 동기화 (현재는 단일 서버 DB)
- 관계도 자동 정렬 / 노드 위치 저장
- 떡밥 ↔ 장면 양방향 표시(보드 카드에서 연결된 떡밥 보기)
- 위키 전문 검색, 내보내기(Markdown/PDF)
