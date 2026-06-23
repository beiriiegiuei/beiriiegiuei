# 배포 가이드 — 링크만 열면 되는 방식

플롯윅스를 웹에 한 번 올려두면, 그 뒤로는 **주소(링크)만 열면** 됩니다.
명령어 없이, 어느 기기에서나, 항상 최신 상태로요.

구성: **Vercel**(앱 호스팅) + **Neon**(무료 PostgreSQL DB).
한 번만 ~10분 설정하면, 이후 코드 업데이트는 GitHub에 push될 때마다 **자동 배포**됩니다.

---

## 1단계 — Neon에서 무료 DB 만들기

1. https://neon.tech 접속 → **Sign up**(GitHub 계정으로 가입 추천)
2. **Create project** → 이름 아무거나, 리전은 `Asia Pacific (Singapore)` 추천 → 생성
3. 생성 후 보이는 **Connection string** 을 복사 (form: `postgresql://...@...neon.tech/neondb?sslmode=require`)
   - "Connection pooling" 옵션은 **꺼둔(Direct) 문자열**로 복사하면 호환성이 가장 좋습니다.

> 이 문자열이 곧 `DATABASE_URL` 입니다. 비밀번호가 포함돼 있으니 외부에 노출하지 마세요.

## 2단계 — DB에 테이블 만들기

따로 할 일 없습니다. **Vercel이 배포할 때 자동으로 테이블을 생성**합니다
(`vercel-build` 스크립트가 `prisma db push`를 실행).

## 3단계 — Vercel에 배포

1. https://vercel.com 접속 → **Sign up**(GitHub 계정으로)
2. **Add New… → Project** → GitHub의 `beiriiegiuei/beiriiegiuei` 저장소 **Import**
3. 배포 설정 화면에서 **Environment Variables** 에 추가:
   - Name: `DATABASE_URL`
   - Value: 1단계에서 복사한 연결 문자열
4. **Deploy** 클릭 → 1~2분 기다리면 `https://....vercel.app` 주소가 나옵니다. 끝!

> 배포 브랜치: Vercel은 기본적으로 저장소의 기본 브랜치를 배포합니다.
> 현재 작업 브랜치(`claude/...`)를 배포하려면 Vercel 프로젝트 설정의
> **Git → Production Branch** 를 해당 브랜치로 바꾸거나, 변경사항을 기본 브랜치에 병합하세요.

---

## 이후 업데이트

- 코드가 GitHub에 push되면 Vercel이 **자동으로 다시 배포**합니다. 새로고침만 하면 최신.
- **스키마(데이터 구조)가 바뀐 경우에만** `npm run db:push`를 한 번 더 실행해야 합니다
  (또는 저에게 말씀해 주시면 처리해 드립니다).

## 비공개로 쓰고 싶다면

배포 링크는 공개됩니다. 나중에 간단한 비밀번호/로그인을 붙일 수 있으니 필요하면 말씀해 주세요.
