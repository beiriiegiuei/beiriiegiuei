import { db } from "@/lib/db";
import { CharactersClient } from "./CharactersClient";

export const dynamic = "force-dynamic";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [characters, relationships] = await Promise.all([
    db.character.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
    }),
    db.relationship.findMany({ where: { projectId: id } }),
  ]);

  return (
    <CharactersClient
      projectId={id}
      characters={characters}
      relationships={relationships}
    />
  );
}
