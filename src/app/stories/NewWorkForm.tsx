"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { IconArrowLeft } from "@/components/icons";
import { createStory } from "./actions";

const COVER_EMOJIS = ["💬", "📖", "💌", "🌙", "⚔️", "🩷", "🕯️", "🌧️", "🎭", "🔮", "🥀", "☕"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "만드는 중…" : "작품 만들기"}
    </button>
  );
}

export function NewWorkForm() {
  const [emoji, setEmoji] = useState("💬");

  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/stories"
          className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-sunk hover:text-ink"
          aria-label="목록으로"
        >
          <IconArrowLeft width={18} height={18} />
        </Link>
        <h1 className="text-xl font-bold text-ink">새 작품 만들기</h1>
      </div>

      <form action={createStory} className="card space-y-4 p-6">
        <div>
          <span className="label">표지 이모지</span>
          <div className="flex flex-wrap gap-1.5">
            {COVER_EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setEmoji(e)}
                aria-pressed={emoji === e}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
                  emoji === e
                    ? "bg-brand-100 ring-2 ring-brand-400"
                    : "bg-paper-sunk hover:bg-line"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <input type="hidden" name="coverEmoji" value={emoji} />
        </div>
        <div>
          <label className="label" htmlFor="title">
            제목 *
          </label>
          <input
            id="title"
            name="title"
            required
            autoFocus
            className="input"
            placeholder="예: 새벽 두 시의 메시지"
          />
        </div>
        <div>
          <label className="label" htmlFor="description">
            소개글
          </label>
          <textarea
            id="description"
            name="description"
            className="input min-h-[80px]"
            placeholder="어떤 이야기인지 짧게 소개해주세요."
          />
        </div>
        <div>
          <label className="label" htmlFor="genre">
            장르
          </label>
          <input
            id="genre"
            name="genre"
            className="input"
            placeholder="예: 로맨스 / 스릴러"
          />
        </div>
        <p className="text-xs text-ink-faint">
          작품을 만든 뒤, 목차에서 1화부터 이어서 쓸 수 있어요.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Link href="/stories" className="btn-ghost">
            취소
          </Link>
          <SubmitButton />
        </div>
      </form>
    </main>
  );
}
