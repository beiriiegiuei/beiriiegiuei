"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function rp(projectId: string) {
  revalidatePath(`/projects/${projectId}/rankings`);
}

/* ---- 랭킹표 ---- */
export async function saveBoard(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const note = String(formData.get("note") || "").trim() || null;
  if (id) {
    await db.rankingBoard.update({ where: { id }, data: { title, note } });
  } else {
    const count = await db.rankingBoard.count({ where: { projectId } });
    await db.rankingBoard.create({ data: { projectId, title, note, order: count } });
  }
  rp(projectId);
}

export async function deleteBoard(projectId: string, id: string) {
  await db.rankingBoard.delete({ where: { id } });
  rp(projectId);
}

/* ---- 시점(스냅샷) ---- */
export async function saveSnapshot(
  projectId: string,
  boardId: string,
  formData: FormData
) {
  const id = String(formData.get("id") || "");
  const label = String(formData.get("label") || "").trim();
  if (!label) return;
  if (id) {
    await db.rankingSnapshot.update({ where: { id }, data: { label } });
  } else {
    const count = await db.rankingSnapshot.count({ where: { boardId } });
    await db.rankingSnapshot.create({ data: { boardId, label, order: count } });
  }
  rp(projectId);
}

export async function deleteSnapshot(projectId: string, id: string) {
  await db.rankingSnapshot.delete({ where: { id } });
  rp(projectId);
}

// 시점 복제: 이전 랭킹을 그대로 복사해 새 시점 생성
export async function duplicateSnapshot(
  projectId: string,
  snapshotId: string,
  label: string
) {
  const src = await db.rankingSnapshot.findUnique({
    where: { id: snapshotId },
    include: { entries: { orderBy: { position: "asc" } } },
  });
  if (!src) return;
  const count = await db.rankingSnapshot.count({ where: { boardId: src.boardId } });
  const snap = await db.rankingSnapshot.create({
    data: {
      boardId: src.boardId,
      label: label.trim() || `${src.label} (복제)`,
      order: count,
    },
  });
  if (src.entries.length) {
    await db.rankingEntry.createMany({
      data: src.entries.map((e) => ({
        snapshotId: snap.id,
        characterId: e.characterId,
        name: e.name,
        note: e.note,
        position: e.position,
      })),
    });
  }
  rp(projectId);
}

/* ---- 항목 ---- */
export async function addEntry(
  projectId: string,
  snapshotId: string,
  formData: FormData
) {
  const characterId = String(formData.get("characterId") || "") || null;
  const name = String(formData.get("name") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;
  if (!characterId && !name) return;
  const count = await db.rankingEntry.count({ where: { snapshotId } });
  await db.rankingEntry.create({
    data: { snapshotId, characterId, name, note, position: count },
  });
  rp(projectId);
}

export async function updateEntry(projectId: string, formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await db.rankingEntry.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "").trim() || null,
      note: String(formData.get("note") || "").trim() || null,
    },
  });
  rp(projectId);
}

export async function deleteEntry(projectId: string, id: string) {
  await db.rankingEntry.delete({ where: { id } });
  rp(projectId);
}

// 드래그로 순위 재정렬
export async function reorderEntry(
  projectId: string,
  snapshotId: string,
  entryId: string,
  beforeEntryId: string | null
) {
  const siblings = await db.rankingEntry.findMany({
    where: { snapshotId },
    orderBy: { position: "asc" },
  });
  const without = siblings.filter((e) => e.id !== entryId);
  const idx = beforeEntryId
    ? without.findIndex((e) => e.id === beforeEntryId)
    : without.length;
  const insertAt = idx === -1 ? without.length : idx;
  const ordered = [
    ...without.slice(0, insertAt),
    { id: entryId },
    ...without.slice(insertAt),
  ];
  await db.$transaction(
    ordered.map((e, i) =>
      db.rankingEntry.update({ where: { id: e.id }, data: { position: i } })
    )
  );
  rp(projectId);
}
