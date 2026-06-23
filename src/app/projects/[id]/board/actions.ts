"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function rp(projectId: string) {
  revalidatePath(`/projects/${projectId}/board`);
}

/* ---- 막(컬럼) ---- */
export async function saveAct(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  if (id) {
    await db.act.update({ where: { id }, data: { title } });
  } else {
    const count = await db.act.count({ where: { projectId } });
    await db.act.create({ data: { projectId, title, order: count } });
  }
  rp(projectId);
}

export async function deleteAct(projectId: string, id: string) {
  // 컬럼 삭제 시 장면은 미분류로
  await db.scene.updateMany({ where: { actId: id }, data: { actId: null } });
  await db.act.delete({ where: { id } });
  rp(projectId);
}

/* ---- 장면(카드) ---- */
export async function saveScene(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const data = {
    title,
    summary: String(formData.get("summary") || "").trim() || null,
    status: String(formData.get("status") || "idea"),
    actId: String(formData.get("actId") || "") || null,
  };
  if (id) {
    await db.scene.update({ where: { id }, data });
  } else {
    const count = await db.scene.count({ where: { projectId } });
    await db.scene.create({ data: { ...data, projectId, order: count } });
  }
  rp(projectId);
}

export async function deleteScene(projectId: string, id: string) {
  await db.scene.delete({ where: { id } });
  rp(projectId);
}

// 드래그앤드롭: 장면을 특정 막의 특정 위치로 이동
export async function moveScene(
  projectId: string,
  sceneId: string,
  actId: string | null,
  beforeSceneId: string | null
) {
  const siblings = await db.scene.findMany({
    where: { projectId, actId },
    orderBy: { order: "asc" },
  });
  const without = siblings.filter((s) => s.id !== sceneId);
  const idx = beforeSceneId
    ? without.findIndex((s) => s.id === beforeSceneId)
    : without.length;
  const insertAt = idx === -1 ? without.length : idx;
  const ordered = [
    ...without.slice(0, insertAt),
    { id: sceneId },
    ...without.slice(insertAt),
  ];
  await db.$transaction([
    db.scene.update({ where: { id: sceneId }, data: { actId } }),
    ...ordered.map((s, i) =>
      db.scene.update({ where: { id: s.id }, data: { order: i } })
    ),
  ]);
  rp(projectId);
}
