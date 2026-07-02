"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconArrowLeft,
  IconHeart,
  IconChat,
  IconSend,
  IconEdit,
  IconChevronRight,
  IconTrash,
} from "@/components/icons";
import { Bubble, isGrouped } from "../../../Bubble";
import {
  toggleLike,
  addComment,
  deleteComment,
  recordRead,
} from "../../../actions";

type Kind = "dialogue" | "thought" | "monologue" | "narration";
type Char = { name: string; emoji: string | null; avatar: string | null; align: string };
type Msg = { id: string; kind: Kind; text: string; characterId: string | null };
type Comment = { id: string; text: string; author: string; mine: boolean };

export function Reader({
  storyId,
  episodeId,
  storyTitle,
  episodeTitle,
  authorName,
  isOwner,
  published,
  nextEpisodeId,
  charMap,
  messages,
  liked,
  likeCount,
  readCount,
  comments,
  startIndex = 0,
}: {
  storyId: string;
  episodeId: string;
  storyTitle: string;
  episodeTitle: string;
  authorName: string;
  isOwner: boolean;
  published: boolean;
  nextEpisodeId: string | null;
  charMap: Record<string, Char>;
  messages: Msg[];
  liked: boolean;
  likeCount: number;
  readCount: number;
  comments: Comment[];
  startIndex?: number; // 이어보기: 지난번 도달 위치
}) {
  const total = messages.length;
  const [revealed, setRevealed] = useState(
    total > 0 ? Math.min(Math.max(1, startIndex + 1), total) : 0,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wheelAt = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = total === 0 || revealed >= total;

  const advance = useCallback(() => {
    setRevealed((r) => (r < total ? r + 1 : r));
  }, [total]);
  const back = useCallback(() => {
    setRevealed((r) => (r > 1 ? r - 1 : r));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && ["INPUT", "TEXTAREA"].includes(el.tagName)) return;
      if ([" ", "Enter", "ArrowRight", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        advance();
      } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    if (total === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const idx = revealed - 1;
    const flush = () => void recordRead(episodeId, idx, total);
    if (revealed >= total) flush();
    else saveTimer.current = setTimeout(flush, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [revealed, total, episodeId]);

  const onWheel = (e: React.WheelEvent) => {
    if (done || e.deltaY <= 0) return;
    const c = scrollRef.current;
    if (!c) return;
    const atBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 12;
    const now = Date.now();
    if (atBottom && now - wheelAt.current > 220) {
      wheelAt.current = now;
      advance();
    }
  };

  const onTapArea = (e: React.MouseEvent) => {
    if (done) return;
    if ((e.target as HTMLElement).closest("button,a,input,textarea,label")) return;
    advance();
  };

  const shown = messages.slice(0, revealed);
  const last = shown[shown.length - 1];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href={`/stories/${storyId}`}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-sunk hover:text-ink"
            aria-label="목차로 돌아가기"
          >
            <IconArrowLeft width={18} height={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-ink">
              {episodeTitle}
            </h1>
            <p className="truncate text-xs text-ink-faint">
              {storyTitle} · ✍️ {authorName}
            </p>
          </div>
          {isOwner && (
            <Link
              href={`/stories/${storyId}/episodes/${episodeId}/edit`}
              className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-sunk hover:text-ink"
              aria-label="이 화 수정"
            >
              <IconEdit width={18} height={18} />
            </Link>
          )}
          <span className="tabular-nums text-xs font-medium text-ink-muted" aria-hidden>
            {Math.min(revealed, total)} / {total}
          </span>
        </div>
        <div
          className="h-0.5 w-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.min(revealed, total)}
          aria-label="읽기 진행도"
        >
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: total ? `${(revealed / total) * 100}%` : "0%" }}
          />
        </div>
      </header>

      {!published && (
        <p className="bg-brand-50 px-4 py-2 text-center text-xs text-brand-700">
          비공개 상태예요. 나만 볼 수 있어요.
        </p>
      )}

      <div ref={scrollRef} onWheel={onWheel} onClick={onTapArea} className="flex-1 px-4 py-6">
        {total === 0 ? (
          <p className="mt-20 text-center text-sm text-ink-faint">
            아직 대화가 없는 화예요.
          </p>
        ) : (
          <>
            <ol className="space-y-3.5">
              {shown.map((m, i) => (
                <li key={m.id} className={isGrouped(shown, i) ? "-mt-2" : ""}>
                  <Bubble
                    kind={m.kind}
                    text={m.text}
                    char={m.characterId ? charMap[m.characterId] : undefined}
                    grouped={isGrouped(shown, i)}
                  />
                </li>
              ))}
            </ol>
            <div className="sr-only" aria-live="polite">
              {last
                ? `${last.characterId && charMap[last.characterId] ? charMap[last.characterId].name + ": " : ""}${last.text}`
                : ""}
            </div>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {!done ? (
        <div className="sticky bottom-0 border-t border-line bg-paper/85 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <button onClick={back} disabled={revealed <= 1} className="btn-outline" aria-label="이전 대화">
              <IconArrowLeft width={16} height={16} />
            </button>
            <button onClick={advance} className="btn-primary flex-1" aria-label="다음 대화 보기">
              다음 <IconChevronRight width={16} height={16} />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-ink-faint">
            화면을 탭하거나 스페이스·방향키로도 넘길 수 있어요
          </p>
        </div>
      ) : (
        total > 0 && (
          <EndPanel
            storyId={storyId}
            episodeId={episodeId}
            nextEpisodeId={nextEpisodeId}
            liked={liked}
            likeCount={likeCount}
            readCount={readCount}
            comments={comments}
          />
        )
      )}
    </main>
  );
}

function EndPanel({
  storyId,
  episodeId,
  nextEpisodeId,
  liked,
  likeCount,
  readCount,
  comments,
}: {
  storyId: string;
  episodeId: string;
  nextEpisodeId: string | null;
  liked: boolean;
  likeCount: number;
  readCount: number;
  comments: Comment[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="border-t border-line bg-paper px-4 py-6" aria-label="반응과 댓글">
      <div className="mb-4 rounded-2xl bg-paper-sunk px-4 py-5 text-center">
        <p className="text-sm font-semibold text-ink">이 화를 다 읽었어요 🎉</p>
        <p className="mt-1 text-xs text-ink-muted">이 화를 연 사람 {readCount}명</p>
        {nextEpisodeId && (
          <Link
            href={`/stories/${storyId}/episodes/${nextEpisodeId}`}
            className="btn-primary mt-3"
          >
            다음 화 <IconChevronRight width={16} height={16} />
          </Link>
        )}
      </div>

      <div className="mb-5 flex gap-2">
        <form action={toggleLike.bind(null, episodeId, storyId)} className="flex-1">
          <button
            className={`btn w-full ${
              liked
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "border border-line-strong bg-paper text-ink-soft hover:bg-paper-sunk"
            }`}
            aria-pressed={liked}
          >
            <IconHeart width={16} height={16} />
            {liked ? "좋아요 취소" : "좋아요"} · {likeCount}
          </button>
        </form>
        <button onClick={() => setOpen((v) => !v)} className="btn-outline" aria-expanded={open}>
          <IconChat width={16} height={16} /> 댓글 {comments.length}
        </button>
      </div>

      {open && (
        <div>
          <form action={addComment.bind(null, episodeId, storyId)} className="mb-4 flex gap-2">
            <input
              name="text"
              required
              maxLength={1000}
              className="input"
              placeholder="따뜻한 감상을 남겨주세요"
              aria-label="댓글 입력"
            />
            <button className="btn-primary shrink-0" aria-label="댓글 등록">
              <IconSend width={16} height={16} />
            </button>
          </form>

          {comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">첫 댓글을 남겨보세요.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-soft">{c.author}</p>
                    <p className="whitespace-pre-wrap break-words text-sm text-ink">{c.text}</p>
                  </div>
                  {c.mine && (
                    <form action={deleteComment.bind(null, c.id, episodeId, storyId)}>
                      <button
                        className="shrink-0 rounded-lg p-1 text-ink-faint hover:bg-red-50 hover:text-red-500"
                        aria-label="댓글 삭제"
                      >
                        <IconTrash width={14} height={14} />
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
