import { db } from "@/lib/db";
import { BoardClient } from "./BoardClient";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [seasons, acts, scenes] = await Promise.all([
    db.season.findMany({ where: { projectId: id }, orderBy: { order: "asc" } }),
    db.act.findMany({ where: { projectId: id }, orderBy: { order: "asc" } }),
    db.scene.findMany({ where: { projectId: id }, orderBy: { order: "asc" } }),
  ]);

  return <BoardClient projectId={id} seasons={seasons} acts={acts} scenes={scenes} />;
}
