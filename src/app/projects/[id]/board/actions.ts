"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function rp(projectId: string) {
  revalidatePath(`/projects/${projectId}/board`);
}

/* ---- 시즌 ---- */
export async function saveSeason(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  if (id) {
    await db.season.update({ where: { id }, data: { title } });
  } else {
    const count = await db.season.count({ where: { projectId } });
    await db.season.create({ data: { projectId, title, order: count } });
  }
  rp(projectId);
}

export async function deleteSeason(projectId: string, id: string) {
  // 시즌 삭제 시 하위 아크는 '시즌 미지정'으로
  await db.act.updateMany({ where: { seasonId: id }, data: { seasonId: null } });
  await db.season.delete({ where: { id } });
  rp(projectId);
}

/* ---- 아크 / 시나리오 ---- */
export async function saveAct(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const epStartRaw = String(formData.get("epStart") || "").trim();
  const epEndRaw = String(formData.get("epEnd") || "").trim();
  const data = {
    title,
    summary: String(formData.get("summary") || "").trim() || null,
    seasonId: String(formData.get("seasonId") || "") || null,
    epStart: epStartRaw ? Number(epStartRaw) : null,
    epEnd: epEndRaw ? Number(epEndRaw) : null,
  };
  if (id) {
    await db.act.update({ where: { id }, data });
  } else {
    const count = await db.act.count({ where: { projectId } });
    await db.act.create({ data: { ...data, projectId, order: count } });
  }
  rp(projectId);
}

export async function deleteAct(projectId: string, id: string) {
  await db.scene.updateMany({ where: { actId: id }, data: { actId: null } });
  await db.act.delete({ where: { id } });
  rp(projectId);
}

/* ---- 회차 / 장면 ---- */
export async function saveScene(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const epRaw = String(formData.get("episodeNo") || "").trim();
  const data = {
    title,
    summary: String(formData.get("summary") || "").trim() || null,
    status: String(formData.get("status") || "idea"),
    actId: String(formData.get("actId") || "") || null,
    episodeNo: epRaw ? Number(epRaw) : null,
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

// 드래그앤드롭: 회차를 특정 아크의 특정 위치로 이동
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
