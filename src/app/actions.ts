"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const logline = String(formData.get("logline") || "").trim() || null;
  const genre = String(formData.get("genre") || "").trim() || null;
  const coverEmoji = String(formData.get("coverEmoji") || "📖").trim() || "📖";

  const project = await db.project.create({
    data: { title, logline, genre, coverEmoji },
  });

  // 기본 콘티 막(컬럼) 3개 생성
  await db.act.createMany({
    data: [
      { projectId: project.id, title: "1막 · 발단", order: 0 },
      { projectId: project.id, title: "2막 · 전개", order: 1 },
      { projectId: project.id, title: "3막 · 결말", order: 2 },
    ],
  });

  revalidatePath("/");
  redirect(`/projects/${project.id}`);
}

export async function deleteProject(id: string) {
  await db.project.delete({ where: { id } });
  revalidatePath("/");
}
