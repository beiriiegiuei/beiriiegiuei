import { db } from "@/lib/db";
import { WikiClient } from "./WikiClient";

export const dynamic = "force-dynamic";

export default async function WikiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pages = await db.wikiPage.findMany({
    where: { projectId: id },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  return <WikiClient projectId={id} pages={pages} />;
}
