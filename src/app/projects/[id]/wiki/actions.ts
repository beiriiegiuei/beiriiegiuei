"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createWikiPage(projectId: string, formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return null;
  const category = String(formData.get("category") || "").trim() || "일반";
  const count = await db.wikiPage.count({ where: { projectId } });
  const page = await db.wikiPage.create({
    data: { projectId, title, category, order: count, content: "" },
  });
  revalidatePath(`/projects/${projectId}/wiki`);
  return page.id;
}

export async function updateWikiPage(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await db.wikiPage.update({
    where: { id },
    data: {
      title,
      category: String(formData.get("category") || "").trim() || "일반",
      content: String(formData.get("content") || ""),
    },
  });
  revalidatePath(`/projects/${projectId}/wiki`);
}

export async function deleteWikiPage(projectId: string, id: string) {
  await db.wikiPage.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/wiki`);
}
