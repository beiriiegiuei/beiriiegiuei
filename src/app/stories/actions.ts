"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

export type MsgKind = "dialogue" | "thought" | "monologue" | "narration";

export type StoryPayload = {
  id?: string;
  title: string;
  description: string;
  coverEmoji: string;
  genre: string;
  published: boolean;
  characters: {
    key: string;
    name: string;
    emoji: string;
    color: string;
    align: "left" | "right";
  }[];
  messages: {
    characterKey: string | null;
    kind: MsgKind;
    text: string;
  }[];
};

const KINDS: MsgKind[] = ["dialogue", "thought", "monologue", "narration"];

// 스토리 생성/수정. 화자·대화 전체를 통째로 저장(교체)한다.
export async function saveStory(
  payload: StoryPayload,
): Promise<{ id: string } | { error: string }> {
  const user = await requireUser();

  const title = payload.title.trim();
  if (!title) return { error: "제목을 입력해주세요." };

  const chars = payload.characters.filter((c) => c.name.trim());
  const messages = payload.messages.filter(
    (m) => m.text.trim() || m.kind === "narration",
  );

  // 소유권 확인 (수정 시)
  let storyId = payload.id;
  if (storyId) {
    const existing = await db.talkStory.findUnique({
      where: { id: storyId },
      select: { authorId: true },
    });
    if (!existing || existing.authorId !== user.id) {
      return { error: "이 작품을 수정할 권한이 없어요." };
    }
    await db.talkStory.update({
      where: { id: storyId },
      data: {
        title,
        description: payload.description.trim() || null,
        coverEmoji: payload.coverEmoji || "💬",
        genre: payload.genre.trim() || null,
        published: payload.published,
      },
    });
    // 기존 대화·화자 삭제 후 재생성 (메시지 → 화자 순서)
    await db.talkMessage.deleteMany({ where: { storyId } });
    await db.talkCharacter.deleteMany({ where: { storyId } });
  } else {
    const created = await db.talkStory.create({
      data: {
        authorId: user.id,
        title,
        description: payload.description.trim() || null,
        coverEmoji: payload.coverEmoji || "💬",
        genre: payload.genre.trim() || null,
        published: payload.published,
      },
    });
    storyId = created.id;
  }

  // 화자 생성 + key → id 매핑
  const keyToId = new Map<string, string>();
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const created = await db.talkCharacter.create({
      data: {
        storyId,
        name: c.name.trim(),
        emoji: c.emoji || "🙂",
        color: c.color || "#7c54f5",
        align: c.align === "right" ? "right" : "left",
        order: i,
      },
    });
    keyToId.set(c.key, created.id);
  }

  // 대화 생성
  if (messages.length) {
    await db.talkMessage.createMany({
      data: messages.map((m, i) => {
        const kind = KINDS.includes(m.kind) ? m.kind : "dialogue";
        const characterId =
          kind === "narration" ? null : keyToId.get(m.characterKey || "") ?? null;
        return {
          storyId: storyId as string,
          characterId,
          kind,
          text: m.text.trim(),
          order: i,
        };
      }),
    });
  }

  revalidatePath("/stories");
  revalidatePath(`/stories/${storyId}`);
  return { id: storyId };
}

export async function deleteStory(id: string) {
  const user = await requireUser();
  const story = await db.talkStory.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!story || story.authorId !== user.id) return;
  await db.talkStory.delete({ where: { id } });
  revalidatePath("/stories");
}

export async function toggleLike(storyId: string) {
  const user = await requireUser();
  const existing = await db.storyLike.findUnique({
    where: { storyId_userId: { storyId, userId: user.id } },
  });
  if (existing) {
    await db.storyLike.delete({ where: { id: existing.id } });
  } else {
    await db.storyLike.create({ data: { storyId, userId: user.id } });
  }
  revalidatePath(`/stories/${storyId}`);
}

export async function addComment(storyId: string, formData: FormData) {
  const user = await requireUser();
  const text = String(formData.get("text") || "").trim();
  if (!text) return;
  await db.storyComment.create({
    data: { storyId, userId: user.id, text: text.slice(0, 1000) },
  });
  revalidatePath(`/stories/${storyId}`);
}

export async function deleteComment(commentId: string, storyId: string) {
  const user = await requireUser();
  const comment = await db.storyComment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  if (!comment || comment.userId !== user.id) return;
  await db.storyComment.delete({ where: { id: commentId } });
  revalidatePath(`/stories/${storyId}`);
}

// 열람 진행도 기록: '연 사람 수 + 완독률' 집계용
export async function recordRead(
  storyId: string,
  maxIndex: number,
  total: number,
) {
  const user = await getCurrentUser();
  if (!user) return;
  const completed = total > 0 && maxIndex >= total - 1;
  const existing = await db.storyRead.findUnique({
    where: { storyId_userId: { storyId, userId: user.id } },
    select: { maxIndex: true },
  });
  const nextMax = Math.max(maxIndex, existing?.maxIndex ?? 0);
  await db.storyRead.upsert({
    where: { storyId_userId: { storyId, userId: user.id } },
    create: { storyId, userId: user.id, maxIndex, completed },
    update: {
      maxIndex: nextMax,
      completed: completed ? true : undefined,
    },
  });
}
