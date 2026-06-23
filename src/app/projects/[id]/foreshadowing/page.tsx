import { db } from "@/lib/db";
import { ForeshadowClient } from "./ForeshadowClient";

export const dynamic = "force-dynamic";

export default async function ForeshadowingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [foreshadows, scenes] = await Promise.all([
    db.foreshadow.findMany({
      where: { projectId: id },
      orderBy: [{ status: "asc" }, { importance: "desc" }, { createdAt: "asc" }],
    }),
    db.scene.findMany({
      where: { projectId: id },
      orderBy: [{ episodeNo: "asc" }, { order: "asc" }],
      select: { id: true, title: true, episodeNo: true },
    }),
  ]);

  return (
    <ForeshadowClient projectId={id} foreshadows={foreshadows} scenes={scenes} />
  );
}
