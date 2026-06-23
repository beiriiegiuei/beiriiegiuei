"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function rp(projectId: string) {
  revalidatePath(`/projects/${projectId}/factions`);
  revalidatePath(`/projects/${projectId}/characters`);
}

export async function saveFaction(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const data = {
    name,
    element: String(formData.get("element") || "").trim() || null,
    emoji: String(formData.get("emoji") || "⚔️").trim() || "⚔️",
    color: String(formData.get("color") || "#7c54f5"),
    summary: String(formData.get("summary") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    leaderId: String(formData.get("leaderId") || "") || null,
    parentId: String(formData.get("parentId") || "") || null,
  };
  // 자기 자신을 상위로 지정 방지
  if (id && data.parentId === id) data.parentId = null;

  if (id) {
    await db.faction.update({ where: { id }, data });
  } else {
    const count = await db.faction.count({ where: { projectId } });
    await db.faction.create({ data: { ...data, projectId, order: count } });
  }
  rp(projectId);
}

export async function deleteFaction(projectId: string, id: string) {
  await db.faction.delete({ where: { id } });
  rp(projectId);
}

export async function saveFactionRelation(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const fromId = String(formData.get("fromId") || "");
  const toId = String(formData.get("toId") || "");
  if (!fromId || !toId || fromId === toId) return;
  const data = {
    fromId,
    toId,
    label: String(formData.get("label") || "").trim() || null,
    kind: String(formData.get("kind") || "neutral"),
    description: String(formData.get("description") || "").trim() || null,
  };
  if (id) {
    await db.factionRelation.update({ where: { id }, data });
  } else {
    await db.factionRelation.create({ data: { ...data, projectId } });
  }
  rp(projectId);
}

export async function deleteFactionRelation(projectId: string, id: string) {
  await db.factionRelation.delete({ where: { id } });
  rp(projectId);
}
