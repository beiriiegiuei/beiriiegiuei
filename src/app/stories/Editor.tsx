"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconPlus,
  IconTrash,
  IconArrowLeft,
} from "@/components/icons";
import { saveStory, type MsgKind, type StoryPayload } from "./actions";

const COVER_EMOJIS = ["💬", "📖", "💌", "🌙", "⚔️", "🩷", "🕯️", "🌧️", "🎭", "🔮", "🥀", "☕"];
const CHAR_EMOJIS = ["🙂", "😎", "😳", "😢", "😠", "😴", "🤍", "🐺", "🐱", "👑", "🌟", "👻"];
const COLORS = ["#7c54f5", "#e0518a", "#e08a3d", "#3daa7c", "#3d7ce0", "#8a3de0", "#555"];

type EditChar = {
  key: string;
  name: string;
  emoji: string;
  color: string;
  align: "left" | "right";
};
type EditMsg = {
  key: string;
  characterKey: string | null;
  kind: MsgKind;
  text: string;
};

const KIND_LABEL: Record<MsgKind, string> = {
  dialogue: "대사",
  thought: "생각",
  monologue: "혼잣말",
  narration: "지문",
};

export function Editor({
  initial,
}: {
  initial?: {
    id: string;
    title: string;
    description: string;
    coverEmoji: string;
    genre: string;
    published: boolean;
    characters: EditChar[];
    messages: EditMsg[];
  };
}) {
  const router = useRouter();
  const idc = useRef(0);
  const nk = (p: string) => `${p}${idc.current++}`;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverEmoji, setCoverEmoji] = useState(initial?.coverEmoji ?? "💬");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [published, setPublished] = useState(initial?.published ?? false);

  const [chars, setChars] = useState<EditChar[]>(
    initial?.characters?.length
      ? initial.characters
      : [
          { key: nk("c"), name: "", emoji: "🙂", color: COLORS[0], align: "left" },
          { key: nk("c"), name: "", emoji: "😎", color: COLORS[3], align: "right" },
        ],
  );
  const [msgs, setMsgs] = useState<EditMsg[]>(
    initial?.messages?.length
      ? initial.messages
      : [{ key: nk("m"), characterKey: null, kind: "dialogue", text: "" }],
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ── 화자 조작 ──
  const addChar = () =>
    setChars((cs) => [
      ...cs,
      {
        key: nk("c"),
        name: "",
        emoji: CHAR_EMOJIS[cs.length % CHAR_EMOJIS.length],
        color: COLORS[cs.length % COLORS.length],
        align: "left",
      },
    ]);
  const patchChar = (key: string, patch: Partial<EditChar>) =>
    setChars((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const removeChar = (key: string) => {
    setChars((cs) => cs.filter((c) => c.key !== key));
    setMsgs((ms) =>
      ms.map((m) => (m.characterKey === key ? { ...m, characterKey: null } : m)),
    );
  };

  // ── 대화 조작 ──
  const addMsg = () =>
    setMsgs((ms) => [
      ...ms,
      {
        key: nk("m"),
        characterKey: chars[0]?.key ?? null,
        kind: "dialogue",
        text: "",
      },
    ]);
  const patchMsg = (key: string, patch: Partial<EditMsg>) =>
    setMsgs((ms) => ms.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  const removeMsg = (key: string) =>
    setMsgs((ms) => ms.filter((m) => m.key !== key));
  const moveMsg = (key: string, dir: -1 | 1) =>
    setMsgs((ms) => {
      const i = ms.findIndex((m) => m.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ms.length) return ms;
      const copy = [...ms];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const onSave = (publish: boolean) => {
    setError(null);
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    const payload: StoryPayload = {
      id: initial?.id,
      title,
      description,
      coverEmoji,
      genre,
      published: publish,
      characters: chars.map((c) => ({
        key: c.key,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
        align: c.align,
      })),
      messages: msgs.map((m) => ({
        characterKey: m.kind === "narration" ? null : m.characterKey,
        kind: m.kind,
        text: m.text,
      })),
    };
    startTransition(async () => {
      const res = await saveStory(payload);
      if ("error" in res) setError(res.error);
      else router.push(`/stories/${res.id}`);
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/stories"
          className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-sunk hover:text-ink"
          aria-label="목록으로"
        >
          <IconArrowLeft width={18} height={18} />
        </Link>
        <h1 className="text-xl font-bold text-ink">
          {initial ? "스토리 수정" : "새 스토리 쓰기"}
        </h1>
      </div>

      {/* 기본 정보 */}
      <section className="card mb-5 space-y-4 p-5">
        <div>
          <span className="label">표지 이모지</span>
          <div className="flex flex-wrap gap-1.5">
            {COVER_EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setCoverEmoji(e)}
                aria-pressed={coverEmoji === e}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
                  coverEmoji === e
                    ? "bg-brand-100 ring-2 ring-brand-400"
                    : "bg-paper-sunk hover:bg-line"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="title">
            제목 *
          </label>
          <input
            id="title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 새벽 두 시의 메시지"
          />
        </div>
        <div>
          <label className="label" htmlFor="desc">
            소개글
          </label>
          <textarea
            id="desc"
            className="input min-h-[70px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="어떤 이야기인지 짧게 소개해주세요."
          />
        </div>
        <div>
          <label className="label" htmlFor="genre">
            장르
          </label>
          <input
            id="genre"
            className="input"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="예: 로맨스 / 스릴러"
          />
        </div>
      </section>

      {/* 등장인물 */}
      <section className="card mb-5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">등장인물</h2>
          <button type="button" onClick={addChar} className="btn-ghost text-sm">
            <IconPlus width={15} height={15} /> 추가
          </button>
        </div>
        <p className="mb-3 text-xs text-ink-faint">
          오른쪽 정렬은 보통 &lsquo;나&rsquo;(주인공) 말풍선으로 쓰여요.
        </p>
        <div className="space-y-3">
          {chars.map((c) => (
            <div
              key={c.key}
              className="rounded-xl border border-line bg-paper-soft p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  value={c.name}
                  onChange={(e) => patchChar(c.key, { name: e.target.value })}
                  placeholder="이름"
                  aria-label="인물 이름"
                />
                <button
                  type="button"
                  onClick={() => removeChar(c.key)}
                  className="rounded-lg p-2 text-ink-faint hover:bg-red-50 hover:text-red-500"
                  aria-label="인물 삭제"
                >
                  <IconTrash width={16} height={16} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-1">
                  {CHAR_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => patchChar(c.key, { emoji: e })}
                      aria-pressed={c.emoji === e}
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-sm ${
                        c.emoji === e ? "bg-brand-100 ring-1 ring-brand-400" : "hover:bg-paper-sunk"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => patchChar(c.key, { color: col })}
                      aria-label={`색상 ${col}`}
                      aria-pressed={c.color === col}
                      className={`h-6 w-6 rounded-full ${
                        c.color === col ? "ring-2 ring-offset-1 ring-ink" : ""
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
                <div
                  className="ml-auto flex rounded-lg bg-paper-sunk p-0.5"
                  role="group"
                  aria-label="말풍선 위치"
                >
                  {(["left", "right"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => patchChar(c.key, { align: a })}
                      aria-pressed={c.align === a}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        c.align === a ? "bg-paper text-ink shadow-card" : "text-ink-muted"
                      }`}
                    >
                      {a === "left" ? "왼쪽" : "오른쪽"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 대화 */}
      <section className="card mb-5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">대화 흐름</h2>
          <button type="button" onClick={addMsg} className="btn-ghost text-sm">
            <IconPlus width={15} height={15} /> 줄 추가
          </button>
        </div>
        <ol className="space-y-2.5">
          {msgs.map((m, i) => (
            <li
              key={m.key}
              className="rounded-xl border border-line bg-paper-soft p-2.5"
            >
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {/* 종류 */}
                <div className="flex rounded-lg bg-paper-sunk p-0.5" role="group" aria-label="말풍선 종류">
                  {(Object.keys(KIND_LABEL) as MsgKind[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => patchMsg(m.key, { kind: k })}
                      aria-pressed={m.kind === k}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        m.kind === k ? "bg-paper text-ink shadow-card" : "text-ink-muted"
                      }`}
                    >
                      {KIND_LABEL[k]}
                    </button>
                  ))}
                </div>
                {/* 화자 */}
                {m.kind !== "narration" && (
                  <select
                    className="input w-auto py-1 text-sm"
                    value={m.characterKey ?? ""}
                    onChange={(e) =>
                      patchMsg(m.key, { characterKey: e.target.value || null })
                    }
                    aria-label="화자 선택"
                  >
                    <option value="">화자 선택</option>
                    {chars.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.emoji} {c.name || "이름 없음"}
                      </option>
                    ))}
                  </select>
                )}
                <div className="ml-auto flex items-center">
                  <button
                    type="button"
                    onClick={() => moveMsg(m.key, -1)}
                    disabled={i === 0}
                    className="rounded p-1 text-ink-faint hover:bg-paper-sunk disabled:opacity-30"
                    aria-label="위로"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMsg(m.key, 1)}
                    disabled={i === msgs.length - 1}
                    className="rounded p-1 text-ink-faint hover:bg-paper-sunk disabled:opacity-30"
                    aria-label="아래로"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMsg(m.key)}
                    className="rounded p-1 text-ink-faint hover:bg-red-50 hover:text-red-500"
                    aria-label="이 줄 삭제"
                  >
                    <IconTrash width={15} height={15} />
                  </button>
                </div>
              </div>
              <textarea
                className="input min-h-[44px] py-2"
                value={m.text}
                onChange={(e) => patchMsg(m.key, { text: e.target.value })}
                placeholder={
                  m.kind === "narration"
                    ? "상황 설명 / 지문 (예: 잠시 정적이 흘렀다)"
                    : "말풍선에 들어갈 내용"
                }
                aria-label="내용"
              />
            </li>
          ))}
        </ol>
      </section>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* 저장 */}
      <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-paper/90 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => onSave(false)}
          disabled={pending}
          className="btn-outline flex-1"
        >
          비공개 저장
        </button>
        <button
          type="button"
          onClick={() => onSave(true)}
          disabled={pending}
          className="btn-primary flex-1"
        >
          {pending ? "저장 중…" : "공개하기"}
        </button>
      </div>
    </main>
  );
}
