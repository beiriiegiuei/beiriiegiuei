"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveForeshadow(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const data = {
    title,
    description: String(formData.get("description") || "").trim() || null,
    importance: Number(formData.get("importance") || 2),
    status: String(formData.get("status") || "planted"),
    plantedSceneId: String(formData.get("plantedSceneId") || "") || null,
    resolvedSceneId: String(formData.get("resolvedSceneId") || "") || null,
  };

  if (id) {
    await db.foreshadow.update({ where: { id }, data });
  } else {
    await db.foreshadow.create({ data: { ...data, projectId } });
  }
  revalidatePath(`/projects/${projectId}/foreshadowing`);
}

export async function setForeshadowStatus(
  projectId: string,
  id: string,
  status: string
) {
  await db.foreshadow.update({ where: { id }, data: { status } });
  revalidatePath(`/projects/${projectId}/foreshadowing`);
}

export async function deleteForeshadow(projectId: string, id: string) {
  await db.foreshadow.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/foreshadowing`);
}
