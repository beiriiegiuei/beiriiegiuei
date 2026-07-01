import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Reader } from "./Reader";

export const dynamic = "force-dynamic";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/stories/${id}`);

  const story = await db.talkStory.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, displayName: true } },
      characters: { orderBy: { order: "asc" } },
      messages: { orderBy: { order: "asc" } },
      likes: { where: { userId: user.id }, select: { id: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { displayName: true } } },
      },
      _count: { select: { likes: true, reads: true } },
    },
  });

  if (!story) notFound();
  const isOwner = story.author.id === user.id;
  if (!story.published && !isOwner) notFound();

  const charMap = Object.fromEntries(
    story.characters.map((c) => [
      c.id,
      { name: c.name, emoji: c.emoji, color: c.color, align: c.align },
    ]),
  );

  return (
    <Reader
      storyId={story.id}
      title={story.title}
      description={story.description}
      authorName={story.author.displayName}
      isOwner={isOwner}
      published={story.published}
      charMap={charMap}
      messages={story.messages.map((m) => ({
        id: m.id,
        kind: m.kind as "dialogue" | "thought" | "monologue" | "narration",
        text: m.text,
        characterId: m.characterId,
      }))}
      liked={story.likes.length > 0}
      likeCount={story._count.likes}
      readCount={story._count.reads}
      comments={story.comments.map((c) => ({
        id: c.id,
        text: c.text,
        author: c.user.displayName,
        mine: c.userId === user.id,
      }))}
    />
  );
}
