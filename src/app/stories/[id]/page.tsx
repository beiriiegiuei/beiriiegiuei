import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Toc } from "./Toc";

export const dynamic = "force-dynamic";

export default async function StoryTocPage({
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
      episodes: {
        orderBy: { number: "asc" },
        include: {
          _count: {
            select: { reads: true, likes: true, comments: true, messages: true },
          },
          reads: {
            where: { userId: user.id },
            select: { maxIndex: true, completed: true },
          },
        },
      },
    },
  });

  if (!story) notFound();
  const isOwner = story.author.id === user.id;
  const visible = isOwner
    ? story.episodes
    : story.episodes.filter((e) => e.published);

  return (
    <Toc
      storyId={story.id}
      title={story.title}
      description={story.description}
      coverEmoji={story.coverEmoji}
      genre={story.genre}
      authorName={story.author.displayName}
      isOwner={isOwner}
      episodes={visible.map((e) => {
        const r = e.reads[0];
        const totalMsg = e._count.messages;
        const percent =
          r && totalMsg > 0
            ? Math.min(100, Math.round(((r.maxIndex + 1) / totalMsg) * 100))
            : 0;
        return {
          id: e.id,
          number: e.number,
          title: e.title,
          published: e.published,
          reads: e._count.reads,
          likes: e._count.likes,
          comments: e._count.comments,
          myStatus: r?.completed
            ? ("done" as const)
            : r
              ? ("reading" as const)
              : ("none" as const),
          myPercent: percent,
        };
      })}
    />
  );
}
