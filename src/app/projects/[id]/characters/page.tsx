import { db } from "@/lib/db";
import { CharactersClient } from "./CharactersClient";

export const dynamic = "force-dynamic";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [characters, relationships, factions] = await Promise.all([
    db.character.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
    }),
    db.relationship.findMany({ where: { projectId: id } }),
    db.faction.findMany({
      where: { projectId: id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, emoji: true },
    }),
  ]);

  return (
    <CharactersClient
      projectId={id}
      characters={characters}
      relationships={relationships}
      factions={factions}
    />
  );
}
