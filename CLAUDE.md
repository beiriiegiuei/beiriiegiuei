# CLAUDE.md

작품 구상 워크스페이스 **플롯윅스(Plotwerks)**. 창작자가 세계관·인물·떡밥·콘티를 한 곳에서 정리하는 풀스택 웹앱.

## 명령어

```bash
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # prisma generate + next build
npm run db:push    # 스키마를 SQLite에 반영 (마이그레이션 히스토리 없음)
npm run db:seed    # 데모 데이터 시드
```

## 아키텍처

- **Next.js 15 App Router** + React 19 + TypeScript.
- 데이터 변경은 모두 **Server Actions**로 처리한다 (별도 REST API 라우트 없음).
  각 기능 폴더의 `actions.ts`에 `"use server"`로 정의하고, 변경 후 `revalidatePath`로 갱신.
- 페이지(`page.tsx`)는 서버 컴포넌트로 Prisma에서 데이터를 읽어 클라이언트 컴포넌트(`*Client.tsx`)에 props로 전달한다.
- DB는 **Prisma + SQLite**(`prisma/dev.db`, gitignore됨). 클라이언트 싱글톤은 `src/lib/db.ts`.
- 모든 데이터 페이지는 `export const dynamic = "force-dynamic"`로 항상 최신 상태를 읽는다.

## 디자인 규칙

- 톤: 미니멀 & 밝음. 색 토큰은 `tailwind.config.ts`의 `ink/paper/line/brand`.
- 공용 클래스: `.card`, `.btn-primary/.btn-ghost/.btn-outline`, `.input`, `.label`, `.chip` (`globals.css`).
- 모달은 `src/components/Modal.tsx`, 아이콘은 외부 의존성 없는 인라인 SVG(`src/components/icons.tsx`).
- UI 문구는 한국어.

## 기능별 위치

- 인물/관계도: `src/app/projects/[id]/characters/`
- 떡밥: `src/app/projects/[id]/foreshadowing/`
- 콘티 보드: `src/app/projects/[id]/board/`
- 위키: `src/app/projects/[id]/wiki/`

## 주의

- 스키마 변경 후엔 `npm run db:push` 필요.
- Next 15에서 `params`는 Promise이므로 `await params` 해야 한다.
