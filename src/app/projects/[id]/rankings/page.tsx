import { db } from "@/lib/db";
import { RankingsClient } from "./RankingsClient";

export const dynamic = "force-dynamic";

export default async function RankingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [boards, characters] = await Promise.all([
    db.rankingBoard.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
      include: {
        snapshots: {
          orderBy: { order: "asc" },
          include: {
            entries: {
              orderBy: { position: "asc" },
              include: {
                character: {
                  select: { id: true, name: true, emoji: true, color: true },
                },
              },
            },
          },
        },
      },
    }),
    db.character.findMany({
      where: { projectId: id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, emoji: true },
    }),
  ]);

  return <RankingsClient projectId={id} boards={boards} characters={characters} />;
}
