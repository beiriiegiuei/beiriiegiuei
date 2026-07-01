"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

export type MsgKind = "dialogue" | "thought" | "monologue" | "narration";
const KINDS: MsgKind[] = ["dialogue", "thought", "monologue", "narration"];

// 프로필 사진(data URL) 최대 크기 — 과도한 용량 방지
const MAX_AVATAR = 1_500_000;

// ── 소유권 확인 헬퍼 ─────────────────────────────────────
async function assertStoryOwner(storyId: string, userId: string) {
  const s = await db.talkStory.findUnique({
    where: { id: storyId },
    select: { authorId: true },
  });
  if (!s || s.authorId !== userId) throw new Error("권한이 없습니다.");
}

async function episodeOwner(episodeId: string, userId: string) {
  const ep = await db.talkEpisode.findUnique({
    where: { id: episodeId },
    select: { storyId: true, story: { select: { authorId: true } } },
  });
  if (!ep || ep.story.authorId !== userId) throw new Error("권한이 없습니다.");
  return ep.storyId;
}

// ── 작품 (Work) ─────────────────────────────────────────
export async function createStory(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const story = await db.talkStory.create({
    data: {
      authorId: user.id,
      title,
      description: String(formData.get("description") || "").trim() || null,
      coverEmoji: String(formData.get("coverEmoji") || "💬") || "💬",
      genre: String(formData.get("genre") || "").trim() || null,
    },
  });
  revalidatePath("/stories");
  redirect(`/stories/${story.id}`);
}

export async function updateStoryMeta(storyId: string, formData: FormData) {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await db.talkStory.update({
    where: { id: storyId },
    data: {
      title,
      description: String(formData.get("description") || "").trim() || null,
      coverEmoji: String(formData.get("coverEmoji") || "💬") || "💬",
      genre: String(formData.get("genre") || "").trim() || null,
    },
  });
  revalidatePath("/stories");
  revalidatePath(`/stories/${storyId}`);
}

export async function deleteStory(storyId: string) {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);
  await db.talkStory.delete({ where: { id: storyId } });
  revalidatePath("/stories");
  redirect("/stories");
}

// ── 화 (Episode) ────────────────────────────────────────
// 새 화를 만들고 곧바로 편집기로 이동
export async function createEpisode(storyId: string) {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);
  const last = await db.talkEpisode.findFirst({
    where: { storyId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const number = (last?.number ?? 0) + 1;
  const ep = await db.talkEpisode.create({
    data: { storyId, number, title: `${number}화`, published: false },
  });
  revalidatePath(`/stories/${storyId}`);
  redirect(`/stories/${storyId}/episodes/${ep.id}/edit`);
}

export async function deleteEpisode(storyId: string, episodeId: string) {
  const user = await requireUser();
  await episodeOwner(episodeId, user.id);
  await db.talkEpisode.delete({ where: { id: episodeId } });
  revalidatePath(`/stories/${storyId}`);
}

export type SaveEpisodeInput = {
  episodeId: string;
  title: string;
  messages: { characterId: string | null; kind: MsgKind; text: string }[];
  publish?: boolean; // true=개시, false=비공개, undefined=현재 상태 유지
};

// 화의 대화 전체를 저장(교체). 인물은 별도 액션으로 이미 저장돼 있음.
export async function saveEpisode(
  input: SaveEpisodeInput,
): Promise<{ ok: true } | { error: string }> {
  const user = await requireUser();
  const storyId = await episodeOwner(input.episodeId, user.id);

  const title = input.title.trim() || "무제";
  const messages = input.messages.filter(
    (m) => m.text.trim() || m.kind === "narration",
  );

  await db.talkEpisode.update({
    where: { id: input.episodeId },
    data: {
      title,
      ...(input.publish === undefined ? {} : { published: input.publish }),
    },
  });

  await db.talkMessage.deleteMany({ where: { episodeId: input.episodeId } });
  if (messages.length) {
    await db.talkMessage.createMany({
      data: messages.map((m, i) => {
        const kind = KINDS.includes(m.kind) ? m.kind : "dialogue";
        return {
          episodeId: input.episodeId,
          characterId: kind === "narration" ? null : m.characterId,
          kind,
          text: m.text.trim(),
          order: i,
        };
      }),
    });
  }

  revalidatePath(`/stories/${storyId}`);
  revalidatePath(`/stories/${storyId}/episodes/${input.episodeId}`);
  revalidatePath(`/stories/${storyId}/episodes/${input.episodeId}/edit`);
  return { ok: true };
}

// ── 인물 (즉시 저장, 작품 단위 공유) ─────────────────────
export type CharInput = {
  name: string;
  emoji: string;
  avatar: string | null;
  align: "left" | "right";
};
export type CharOut = {
  id: string;
  name: string;
  emoji: string | null;
  avatar: string | null;
  align: string;
};

function cleanAvatar(avatar: string | null): string | null {
  if (!avatar) return null;
  if (!avatar.startsWith("data:image/")) return null;
  if (avatar.length > MAX_AVATAR) throw new Error("사진 용량이 너무 큽니다.");
  return avatar;
}

export async function createCharacter(
  storyId: string,
  data: CharInput,
): Promise<CharOut> {
  const user = await requireUser();
  await assertStoryOwner(storyId, user.id);
  const count = await db.talkCharacter.count({ where: { storyId } });
  const char = await db.talkCharacter.create({
    data: {
      storyId,
      name: data.name.trim() || "이름 없음",
      emoji: data.emoji || "🙂",
      avatar: cleanAvatar(data.avatar),
      align: data.align === "right" ? "right" : "left",
      order: count,
    },
    select: { id: true, name: true, emoji: true, avatar: true, align: true },
  });
  return char;
}

export async function updateCharacter(
  characterId: string,
  data: CharInput,
): Promise<CharOut> {
  const user = await requireUser();
  const char = await db.talkCharacter.findUnique({
    where: { id: characterId },
    select: { story: { select: { authorId: true } } },
  });
  if (!char || char.story.authorId !== user.id) throw new Error("권한이 없습니다.");
  return db.talkCharacter.update({
    where: { id: characterId },
    data: {
      name: data.name.trim() || "이름 없음",
      emoji: data.emoji || "🙂",
      avatar: cleanAvatar(data.avatar),
      align: data.align === "right" ? "right" : "left",
    },
    select: { id: true, name: true, emoji: true, avatar: true, align: true },
  });
}

export async function deleteCharacter(characterId: string) {
  const user = await requireUser();
  const char = await db.talkCharacter.findUnique({
    where: { id: characterId },
    select: { story: { select: { authorId: true } } },
  });
  if (!char || char.story.authorId !== user.id) return;
  await db.talkCharacter.delete({ where: { id: characterId } });
}

// ── 읽기 상호작용 (화 단위) ──────────────────────────────
export async function toggleLike(episodeId: string, storyId: string) {
  const user = await requireUser();
  const existing = await db.storyLike.findUnique({
    where: { episodeId_userId: { episodeId, userId: user.id } },
  });
  if (existing) {
    await db.storyLike.delete({ where: { id: existing.id } });
  } else {
    await db.storyLike.create({ data: { episodeId, userId: user.id } });
  }
  revalidatePath(`/stories/${storyId}/episodes/${episodeId}`);
}

export async function addComment(
  episodeId: string,
  storyId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const text = String(formData.get("text") || "").trim();
  if (!text) return;
  await db.storyComment.create({
    data: { episodeId, userId: user.id, text: text.slice(0, 1000) },
  });
  revalidatePath(`/stories/${storyId}/episodes/${episodeId}`);
}

export async function deleteComment(
  commentId: string,
  episodeId: string,
  storyId: string,
) {
  const user = await requireUser();
  const comment = await db.storyComment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  if (!comment || comment.userId !== user.id) return;
  await db.storyComment.delete({ where: { id: commentId } });
  revalidatePath(`/stories/${storyId}/episodes/${episodeId}`);
}

// 열람 진행도 기록: '연 사람 수 + 완독률' 집계용
export async function recordRead(
  episodeId: string,
  maxIndex: number,
  total: number,
) {
  const user = await getCurrentUser();
  if (!user) return;
  const completed = total > 0 && maxIndex >= total - 1;
  const existing = await db.storyRead.findUnique({
    where: { episodeId_userId: { episodeId, userId: user.id } },
    select: { maxIndex: true },
  });
  const nextMax = Math.max(maxIndex, existing?.maxIndex ?? 0);
  await db.storyRead.upsert({
    where: { episodeId_userId: { episodeId, userId: user.id } },
    create: { episodeId, userId: user.id, maxIndex, completed },
    update: { maxIndex: nextMax, completed: completed ? true : undefined },
  });
}
