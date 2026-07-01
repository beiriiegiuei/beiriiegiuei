import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Editor } from "../../Editor";

export const dynamic = "force-dynamic";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/stories/${id}/edit`);

  const story = await db.talkStory.findUnique({
    where: { id },
    include: {
      characters: { orderBy: { order: "asc" } },
      messages: { orderBy: { order: "asc" } },
    },
  });

  if (!story || story.authorId !== user.id) notFound();

  // DB의 character.id를 편집기용 key로 그대로 사용
  return (
    <Editor
      initial={{
        id: story.id,
        title: story.title,
        description: story.description ?? "",
        coverEmoji: story.coverEmoji ?? "💬",
        genre: story.genre ?? "",
        published: story.published,
        characters: story.characters.map((c) => ({
          key: c.id,
          name: c.name,
          emoji: c.emoji ?? "🙂",
          color: c.color ?? "#7c54f5",
          align: c.align === "right" ? "right" : "left",
        })),
        messages: story.messages.map((m) => ({
          key: m.id,
          characterKey: m.characterId,
          kind: m.kind as "dialogue" | "thought" | "monologue" | "narration",
          text: m.text,
        })),
      }}
    />
  );
}
