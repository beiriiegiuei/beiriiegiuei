import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Editor } from "../../../../Editor";

export const dynamic = "force-dynamic";

export default async function EpisodeEditPage({
  params,
}: {
  params: Promise<{ id: string; epId: string }>;
}) {
  const { id, epId } = await params;
  const user = await requireUser(`/stories/${id}/episodes/${epId}/edit`);

  const episode = await db.talkEpisode.findUnique({
    where: { id: epId },
    include: {
      story: {
        select: {
          id: true,
          authorId: true,
          title: true,
          characters: {
            orderBy: { order: "asc" },
            select: { id: true, name: true, emoji: true, avatar: true, align: true },
          },
        },
      },
      messages: { orderBy: { order: "asc" } },
    },
  });

  if (!episode || episode.story.id !== id) notFound();
  if (episode.story.authorId !== user.id) notFound();

  return (
    <Editor
      storyId={id}
      storyTitle={episode.story.title}
      episodeId={episode.id}
      initialTitle={episode.title}
      published={episode.published}
      initialCharacters={episode.story.characters.map((c) => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji ?? "🙂",
        avatar: c.avatar,
        align: c.align === "right" ? "right" : "left",
      }))}
      initialMessages={episode.messages.map((m) => ({
        key: m.id,
        characterId: m.characterId,
        kind: m.kind as "dialogue" | "thought" | "monologue" | "narration",
        text: m.text,
      }))}
    />
  );
}
