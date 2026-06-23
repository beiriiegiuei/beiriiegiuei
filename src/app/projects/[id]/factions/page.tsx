import { db } from "@/lib/db";
import { FactionsClient } from "./FactionsClient";

export const dynamic = "force-dynamic";

export default async function FactionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [factions, relations, characters] = await Promise.all([
    db.faction.findMany({
      where: { projectId: id },
      orderBy: { order: "asc" },
      include: {
        leader: { select: { id: true, name: true, emoji: true } },
        members: {
          select: { id: true, name: true, emoji: true, rank: true },
          orderBy: { rank: "asc" },
        },
        _count: { select: { members: true } },
      },
    }),
    db.factionRelation.findMany({ where: { projectId: id } }),
    db.character.findMany({
      where: { projectId: id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, emoji: true },
    }),
  ]);

  return (
    <FactionsClient
      projectId={id}
      factions={factions}
      relations={relations}
      characters={characters}
    />
  );
}
