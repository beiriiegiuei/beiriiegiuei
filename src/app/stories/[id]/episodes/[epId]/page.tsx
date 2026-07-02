import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Reader } from "./Reader";

export const dynamic = "force-dynamic";

export default async function EpisodeReaderPage({
  params,
}: {
  params: Promise<{ id: string; epId: string }>;
}) {
  const { id, epId } = await params;
  const user = await requireUser(`/stories/${id}/episodes/${epId}`);

  const episode = await db.talkEpisode.findUnique({
    where: { id: epId },
    include: {
      story: {
        select: {
          id: true,
          title: true,
          authorId: true,
          author: { select: { displayName: true } },
          characters: {
            orderBy: { order: "asc" },
            select: { id: true, name: true, emoji: true, avatar: true, align: true },
          },
          episodes: {
            orderBy: { number: "asc" },
            select: { id: true, number: true, published: true },
          },
        },
      },
      messages: { orderBy: { order: "asc" } },
      likes: { where: { userId: user.id }, select: { id: true } },
      reads: {
        where: { userId: user.id },
        select: { maxIndex: true, completed: true },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { displayName: true } } },
      },
      _count: { select: { likes: true, reads: true } },
    },
  });

  if (!episode || episode.story.id !== id) notFound();
  const isOwner = episode.story.authorId === user.id;
  if (!episode.published && !isOwner) notFound();

  // 다음 화 (본인은 전체, 독자는 공개된 것 중 다음 번호)
  const next = episode.story.episodes
    .filter((e) => e.number > episode.number && (isOwner || e.published))
    .sort((a, b) => a.number - b.number)[0];

  // 이어보기: 완독 전이면 지난번 도달 위치에서 시작
  const myRead = episode.reads[0];
  const startIndex = myRead && !myRead.completed ? myRead.maxIndex : 0;

  const charMap = Object.fromEntries(
    episode.story.characters.map((c) => [
      c.id,
      { name: c.name, emoji: c.emoji, avatar: c.avatar, align: c.align },
    ]),
  );

  return (
    <Reader
      storyId={id}
      episodeId={episode.id}
      storyTitle={episode.story.title}
      episodeTitle={episode.title}
      authorName={episode.story.author.displayName}
      isOwner={isOwner}
      published={episode.published}
      nextEpisodeId={next?.id ?? null}
      charMap={charMap}
      messages={episode.messages.map((m) => ({
        id: m.id,
        kind: m.kind as "dialogue" | "thought" | "monologue" | "narration",
        text: m.text,
        characterId: m.characterId,
      }))}
      liked={episode.likes.length > 0}
      likeCount={episode._count.likes}
      readCount={episode._count.reads}
      comments={episode.comments.map((c) => ({
        id: c.id,
        text: c.text,
        author: c.user.displayName,
        mine: c.userId === user.id,
      }))}
      startIndex={startIndex}
    />
  );
}
