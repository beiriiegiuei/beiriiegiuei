-- 톡스토리 구조 전환용 1회성(멱등) 정리 스크립트.
-- 작품→화 구조로 바꾸면서 자식 표에 필수 외래키 컬럼이 추가되는데,
-- 기존 표에 행이 있으면 in-place 마이그레이션이 실패한다.
-- 그래서 '아직 새 구조가 아닐 때만' 톡스토리 표들을 비우고,
-- 이어지는 `prisma db push`가 새 구조로 다시 만들게 한다.
--
-- 판별 기준: TalkMessage.episodeId(새 구조의 컬럼)가 없으면 아직 구 구조.
-- User / Project 등 다른 데이터는 절대 건드리지 않는다.
-- 이미 새 구조면 아무 것도 하지 않으므로 이후 배포에서도 안전하다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'TalkMessage'
      AND column_name = 'episodeId'
  ) THEN
    DROP TABLE IF EXISTS "StoryRead" CASCADE;
    DROP TABLE IF EXISTS "StoryComment" CASCADE;
    DROP TABLE IF EXISTS "StoryLike" CASCADE;
    DROP TABLE IF EXISTS "TalkMessage" CASCADE;
    DROP TABLE IF EXISTS "TalkCharacter" CASCADE;
    DROP TABLE IF EXISTS "TalkEpisode" CASCADE;
    DROP TABLE IF EXISTS "TalkStory" CASCADE;
  END IF;
END $$;
