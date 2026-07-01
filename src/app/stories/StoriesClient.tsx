"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { IconTrash, IconEdit } from "@/components/icons";
import { deleteStory } from "./actions";

type StoryCardData = {
  id: string;
  title: string;
  description: string | null;
  coverEmoji: string | null;
  genre: string | null;
  published: boolean;
  author: { displayName: string };
  _count: { reads: number; likes: number };
};

export function StoryCard({
  story,
  owner,
}: {
  story: StoryCardData;
  owner: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="group relative">
      <Link
        href={`/stories/${story.id}`}
        className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-3xl">{story.coverEmoji || "💬"}</span>
          {!story.published && (
            <span className="chip bg-paper-sunk text-ink-muted">비공개</span>
          )}
        </div>
        <h3 className="line-clamp-1 text-lg font-semibold text-ink">
          {story.title}
        </h3>
        {story.genre && (
          <span className="chip mt-1 bg-brand-50 text-brand-700">
            {story.genre}
          </span>
        )}
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-ink-muted">
          {story.description || "소개글이 아직 없어요."}
        </p>
        <div className="mt-4 flex items-center justify-between text-xs text-ink-faint">
          <span>✍️ {story.author.displayName}</span>
          <span className="flex gap-3">
            <span>👀 {story._count.reads}</span>
            <span>💜 {story._count.likes}</span>
          </span>
        </div>
      </Link>

      {owner && (
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <Link
            href={`/stories/${story.id}/edit`}
            className="rounded-lg bg-paper/90 p-1.5 text-ink-faint hover:bg-brand-50 hover:text-brand-600"
            aria-label="수정"
          >
            <IconEdit width={16} height={16} />
          </Link>
          <button
            onClick={() => setConfirming(true)}
            className="rounded-lg bg-paper/90 p-1.5 text-ink-faint hover:bg-red-50 hover:text-red-500"
            aria-label="삭제"
          >
            <IconTrash width={16} height={16} />
          </button>
        </div>
      )}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="스토리 삭제"
        width="max-w-sm"
      >
        <p className="text-sm text-ink-soft">
          <b>{story.title}</b> 이야기와 모든 대화·댓글·좋아요가 영구히 삭제됩니다.
          되돌릴 수 없어요.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirming(false)}>
            취소
          </button>
          <form action={deleteStory.bind(null, story.id)}>
            <button className="btn bg-red-500 text-white hover:bg-red-600">
              삭제
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
