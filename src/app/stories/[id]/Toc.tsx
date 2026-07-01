"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import {
  IconArrowLeft,
  IconPlus,
  IconEdit,
  IconTrash,
} from "@/components/icons";
import {
  createEpisode,
  deleteEpisode,
  deleteStory,
  updateStoryMeta,
} from "../actions";

type Ep = {
  id: string;
  number: number;
  title: string;
  published: boolean;
  reads: number;
  likes: number;
  comments: number;
};

const COVER_EMOJIS = ["💬", "📖", "💌", "🌙", "⚔️", "🩷", "🕯️", "🌧️", "🎭", "🔮", "🥀", "☕"];

export function Toc({
  storyId,
  title,
  description,
  coverEmoji,
  genre,
  authorName,
  isOwner,
  episodes,
}: {
  storyId: string;
  title: string;
  description: string | null;
  coverEmoji: string | null;
  genre: string | null;
  authorName: string;
  isOwner: boolean;
  episodes: Ep[];
}) {
  const [editing, setEditing] = useState(false);
  const [emoji, setEmoji] = useState(coverEmoji || "💬");
  const [deletingWork, setDeletingWork] = useState(false);
  const [deletingEp, setDeletingEp] = useState<Ep | null>(null);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/stories"
          className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-sunk hover:text-ink"
          aria-label="목록으로"
        >
          <IconArrowLeft width={18} height={18} />
        </Link>
        <span className="text-sm text-ink-faint">작품 목차</span>
      </div>

      {/* 작품 헤더 */}
      <header className="card mb-6 p-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{coverEmoji || "💬"}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            <p className="mt-0.5 text-sm text-ink-faint">✍️ {authorName}</p>
            {genre && (
              <span className="chip mt-2 bg-brand-50 text-brand-700">{genre}</span>
            )}
          </div>
        </div>
        {description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-ink-muted">
            {description}
          </p>
        )}
        {isOwner && (
          <div className="mt-4 flex gap-2 border-t border-line pt-4">
            <button
              onClick={() => {
                setEmoji(coverEmoji || "💬");
                setEditing(true);
              }}
              className="btn-outline text-sm"
            >
              <IconEdit width={15} height={15} /> 작품 정보 수정
            </button>
            <button
              onClick={() => setDeletingWork(true)}
              className="btn-ghost text-sm text-red-500 hover:bg-red-50"
            >
              <IconTrash width={15} height={15} /> 작품 삭제
            </button>
          </div>
        )}
      </header>

      {/* 화 목록 */}
      <section aria-labelledby="ep-heading">
        <h2 id="ep-heading" className="mb-3 text-sm font-semibold text-ink-muted">
          목차 · {episodes.length}화
        </h2>

        {episodes.length === 0 ? (
          <div className="card px-6 py-12 text-center text-sm text-ink-muted">
            {isOwner
              ? "아직 화가 없어요. 아래에서 첫 화를 만들어보세요."
              : "아직 공개된 화가 없어요."}
          </div>
        ) : (
          <ol className="space-y-2.5">
            {episodes.map((e) => (
              <li key={e.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/stories/${storyId}/episodes/${e.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{e.title}</span>
                      {!e.published && (
                        <span className="chip bg-paper-sunk text-ink-muted">
                          비공개
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex gap-3 text-xs text-ink-faint">
                      <span>👀 {e.reads}</span>
                      <span>💜 {e.likes}</span>
                      <span>💬 {e.comments}</span>
                    </div>
                  </Link>
                  {isOwner && (
                    <div className="flex shrink-0 gap-1">
                      <Link
                        href={`/stories/${storyId}/episodes/${e.id}/edit`}
                        className="rounded-lg p-2 text-ink-faint hover:bg-brand-50 hover:text-brand-600"
                        aria-label={`${e.title} 수정`}
                      >
                        <IconEdit width={16} height={16} />
                      </Link>
                      <button
                        onClick={() => setDeletingEp(e)}
                        className="rounded-lg p-2 text-ink-faint hover:bg-red-50 hover:text-red-500"
                        aria-label={`${e.title} 삭제`}
                      >
                        <IconTrash width={16} height={16} />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {isOwner && (
          <form action={createEpisode.bind(null, storyId)} className="mt-4">
            <button className="btn-primary w-full">
              <IconPlus width={16} height={16} /> 새 화 만들기
            </button>
          </form>
        )}
      </section>

      {/* 작품 정보 수정 */}
      <Modal open={editing} onClose={() => setEditing(false)} title="작품 정보 수정">
        <form action={updateStoryMeta.bind(null, storyId)} className="space-y-4">
          <div>
            <span className="label">표지 이모지</span>
            <div className="flex flex-wrap gap-1.5">
              {COVER_EMOJIS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setEmoji(em)}
                  aria-pressed={emoji === em}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
                    emoji === em
                      ? "bg-brand-100 ring-2 ring-brand-400"
                      : "bg-paper-sunk hover:bg-line"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <input type="hidden" name="coverEmoji" value={emoji} />
          </div>
          <div>
            <label className="label" htmlFor="m-title">제목 *</label>
            <input id="m-title" name="title" required defaultValue={title} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="m-desc">소개글</label>
            <textarea
              id="m-desc"
              name="description"
              defaultValue={description ?? ""}
              className="input min-h-[80px]"
            />
          </div>
          <div>
            <label className="label" htmlFor="m-genre">장르</label>
            <input id="m-genre" name="genre" defaultValue={genre ?? ""} className="input" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
              취소
            </button>
            <button type="submit" className="btn-primary" onClick={() => setEditing(false)}>
              저장
            </button>
          </div>
        </form>
      </Modal>

      {/* 작품 삭제 */}
      <Modal
        open={deletingWork}
        onClose={() => setDeletingWork(false)}
        title="작품 삭제"
        width="max-w-sm"
      >
        <p className="text-sm text-ink-soft">
          <b>{title}</b> 작품과 모든 화·인물·댓글·좋아요가 영구히 삭제됩니다. 되돌릴 수
          없어요.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setDeletingWork(false)}>
            취소
          </button>
          <form action={deleteStory.bind(null, storyId)}>
            <button className="btn bg-red-500 text-white hover:bg-red-600">삭제</button>
          </form>
        </div>
      </Modal>

      {/* 화 삭제 */}
      <Modal
        open={!!deletingEp}
        onClose={() => setDeletingEp(null)}
        title="화 삭제"
        width="max-w-sm"
      >
        <p className="text-sm text-ink-soft">
          <b>{deletingEp?.title}</b> 을(를) 삭제하면 그 화의 대화·댓글·조회 기록이 함께
          사라져요.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setDeletingEp(null)}>
            취소
          </button>
          {deletingEp && (
            <form action={deleteEpisode.bind(null, storyId, deletingEp.id)}>
              <button
                className="btn bg-red-500 text-white hover:bg-red-600"
                onClick={() => setDeletingEp(null)}
              >
                삭제
              </button>
            </form>
          )}
        </div>
      </Modal>
    </main>
  );
}
