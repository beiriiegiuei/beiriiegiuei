import { db } from "@/lib/db";
import { BoardClient } from "./BoardClient";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [acts, scenes] = await Promise.all([
    db.act.findMany({ where: { projectId: id }, orderBy: { order: "asc" } }),
    db.scene.findMany({ where: { projectId: id }, orderBy: { order: "asc" } }),
  ]);

  return <BoardClient projectId={id} acts={acts} scenes={scenes} />;
}
