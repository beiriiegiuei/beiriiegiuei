"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const FIELDS = [
  "name",
  "role",
  "emoji",
  "color",
  "summary",
  "age",
  "gender",
  "appearance",
  "personality",
  "background",
  "goal",
  "notes",
] as const;

function readCharacter(formData: FormData) {
  const data: Record<string, string | null> = {};
  for (const f of FIELDS) {
    const v = String(formData.get(f) ?? "").trim();
    data[f] = v || null;
  }
  return data;
}

export async function saveCharacter(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const data = readCharacter(formData);
  if (!data.name) return;

  if (id) {
    await db.character.update({ where: { id }, data });
  } else {
    const count = await db.character.count({ where: { projectId } });
    await db.character.create({
      data: { ...data, name: data.name!, projectId, order: count },
    });
  }
  revalidatePath(`/projects/${projectId}/characters`);
}

export async function deleteCharacter(projectId: string, id: string) {
  await db.character.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/characters`);
}

export async function saveRelationship(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const fromId = String(formData.get("fromId") || "");
  const toId = String(formData.get("toId") || "");
  const label = String(formData.get("label") || "").trim() || null;
  const kind = String(formData.get("kind") || "neutral");
  const description = String(formData.get("description") || "").trim() || null;
  if (!fromId || !toId || fromId === toId) return;

  if (id) {
    await db.relationship.update({
      where: { id },
      data: { fromId, toId, label, kind, description },
    });
  } else {
    await db.relationship.create({
      data: { projectId, fromId, toId, label, kind, description },
    });
  }
  revalidatePath(`/projects/${projectId}/characters`);
}

export async function deleteRelationship(projectId: string, id: string) {
  await db.relationship.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/characters`);
}
