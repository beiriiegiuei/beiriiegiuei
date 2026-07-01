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
import {
  toggleLike,
  addComment,
  deleteComment,
  recordRead,
} from "../actions";

type Kind = "dialogue" | "thought" | "monologue" | "narration";
type Char = { name: string; emoji: string | null; color: string | null; align: string };
type Msg = { id: string; kind: Kind; text: string; characterId: string | null };
type Comment = { id: string; text: string; author: string; mine: boolean };

export function Reader({
  storyId,
  title,
  description,
  authorName,
  isOwner,
  published,
  charMap,
  messages,
  liked,
  likeCount,
  readCount,
  comments,
}: {
  storyId: string;
  title: string;
  description: string | null;
  authorName: string;
  isOwner: boolean;
  published: boolean;
  charMap: Record<string, Char>;
  messages: Msg[];
  liked: boolean;
  likeCount: number;
  readCount: number;
  comments: Comment[];
}) {
  const total = messages.length;
  const [revealed, setRevealed] = useState(total > 0 ? 1 : 0);
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

  // 키보드: 스페이스·엔터·→·↓ = 다음, ←·↑ = 이전
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

  // 새 대화가 열리면 아래로 스크롤 + 진행도 저장(디바운스)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    if (total === 0) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const idx = revealed - 1;
    const flush = () => void recordRead(storyId, idx, total);
    if (revealed >= total) flush();
    else saveTimer.current = setTimeout(flush, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [revealed, total, storyId]);

  // 스크롤로 계속: 맨 아래에서 아래로 굴리면 다음 대화가 열림
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

  // 대화 영역 탭(클릭)으로 계속 — 버튼/링크/입력 클릭은 제외
  const onTapArea = (e: React.MouseEvent) => {
    if (done) return;
    if ((e.target as HTMLElement).closest("button,a,input,textarea,label")) return;
    advance();
  };

  const shown = messages.slice(0, revealed);
  const last = shown[shown.length - 1];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col">
      {/* 상단 바 */}
      <header className="sticky top-0 z-10 border-b border-line bg-paper/85 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/stories"
            className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-sunk hover:text-ink"
            aria-label="목록으로 돌아가기"
          >
            <IconArrowLeft width={18} height={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-ink">{title}</h1>
            <p className="truncate text-xs text-ink-faint">✍️ {authorName}</p>
          </div>
          {isOwner && (
            <Link
              href={`/stories/${storyId}/edit`}
              className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-sunk hover:text-ink"
              aria-label="이 스토리 수정"
            >
              <IconEdit width={18} height={18} />
            </Link>
          )}
          <span
            className="tabular-nums text-xs font-medium text-ink-muted"
            aria-hidden
          >
            {Math.min(revealed, total)} / {total}
          </span>
        </div>
        {/* 진행 막대 */}
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

      {/* 대화 영역 */}
      <div
        ref={scrollRef}
        onWheel={onWheel}
        onClick={onTapArea}
        className="flex-1 px-4 py-6"
      >
        {total === 0 ? (
          <p className="mt-20 text-center text-sm text-ink-faint">
            아직 대화가 없는 이야기예요.
          </p>
        ) : (
          <>
            {description && revealed <= 1 && (
              <p className="mb-6 rounded-xl bg-paper-sunk px-4 py-3 text-center text-sm text-ink-muted">
                {description}
              </p>
            )}
            <ol className="space-y-3.5">
              {shown.map((m) => (
                <li key={m.id}>
                  <Bubble msg={m} char={m.characterId ? charMap[m.characterId] : undefined} />
                </li>
              ))}
            </ol>
            {/* 스크린리더용: 방금 열린 대화 안내 */}
            <div className="sr-only" aria-live="polite">
              {last
                ? `${last.characterId && charMap[last.characterId] ? charMap[last.characterId].name + ": " : ""}${last.text}`
                : ""}
            </div>
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* 하단: 진행 중이면 계속 버튼, 끝났으면 좋아요/댓글 */}
      {!done ? (
        <div className="sticky bottom-0 border-t border-line bg-paper/85 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              onClick={back}
              disabled={revealed <= 1}
              className="btn-outline"
              aria-label="이전 대화"
            >
              <IconArrowLeft width={16} height={16} />
            </button>
            <button
              onClick={advance}
              className="btn-primary flex-1"
              aria-label="다음 대화 보기"
            >
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

// ── 말풍선 ──────────────────────────────────────────────
function Bubble({ msg, char }: { msg: Msg; char?: Char }) {
  if (msg.kind === "narration") {
    return (
      <div className="my-2 flex items-center gap-3 py-1" role="note">
        <span className="h-px flex-1 bg-line" />
        <span className="max-w-[80%] text-center text-sm italic text-ink-muted">
          {msg.text}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }

  const right = char?.align === "right";
  const color = char?.color || "#7c54f5";

  // 말풍선 종류별 스타일
  let bubbleClass =
    "rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words";
  let tag: string | null = null;
  if (msg.kind === "dialogue") {
    bubbleClass += right
      ? " bg-brand-600 text-white rounded-br-md"
      : " bg-paper-sunk text-ink rounded-bl-md";
  } else if (msg.kind === "thought") {
    bubbleClass +=
      " border border-dashed border-line-strong bg-paper text-ink-muted italic";
    tag = "💭 생각";
  } else {
    // monologue 혼잣말
    bubbleClass += " bg-paper border border-line text-ink-soft italic";
    tag = "혼잣말";
  }

  return (
    <div
      className={`flex items-end gap-2 ${right ? "flex-row-reverse" : "flex-row"}`}
    >
      <span
        className="mb-0.5 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-base"
        style={{ backgroundColor: `${color}22` }}
        aria-hidden
      >
        {char?.emoji || "🙂"}
      </span>
      <div className={`flex max-w-[78%] flex-col ${right ? "items-end" : "items-start"}`}>
        <span className="mb-0.5 px-1 text-xs font-medium text-ink-muted">
          {char?.name || "?"}
          {tag && (
            <span className="ml-1 text-ink-faint">· {tag}</span>
          )}
        </span>
        <div className={bubbleClass} style={right && msg.kind === "dialogue" ? { backgroundColor: color } : undefined}>
          {msg.text}
        </div>
      </div>
    </div>
  );
}

// ── 완독 후: 좋아요 + 댓글 ───────────────────────────────
function EndPanel({
  storyId,
  liked,
  likeCount,
  readCount,
  comments,
}: {
  storyId: string;
  liked: boolean;
  likeCount: number;
  readCount: number;
  comments: Comment[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="border-t border-line bg-paper px-4 py-6" aria-label="반응과 댓글">
      <div className="mb-4 rounded-2xl bg-paper-sunk px-4 py-5 text-center">
        <p className="text-sm font-semibold text-ink">끝까지 읽었어요 🎉</p>
        <p className="mt-1 text-xs text-ink-muted">
          이 이야기를 연 사람 {readCount}명
        </p>
      </div>

      <div className="mb-5 flex gap-2">
        <form action={toggleLike.bind(null, storyId)} className="flex-1">
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
        <button
          onClick={() => setOpen((v) => !v)}
          className="btn-outline"
          aria-expanded={open}
        >
          <IconChat width={16} height={16} /> 댓글 {comments.length}
        </button>
      </div>

      {open && (
        <div>
          <form
            action={addComment.bind(null, storyId)}
            className="mb-4 flex gap-2"
          >
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
            <p className="py-6 text-center text-sm text-ink-faint">
              첫 댓글을 남겨보세요.
            </p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-soft">{c.author}</p>
                    <p className="whitespace-pre-wrap break-words text-sm text-ink">
                      {c.text}
                    </p>
                  </div>
                  {c.mine && (
                    <form action={deleteComment.bind(null, c.id, storyId)}>
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
