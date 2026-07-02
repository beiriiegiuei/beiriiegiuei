"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/Modal";
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconSend,
  IconEdit,
  IconCheck,
  IconSwap,
} from "@/components/icons";
import { Avatar } from "./Avatar";
import { Bubble, isGrouped, type Kind } from "./Bubble";
import {
  saveEpisode,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  type CharOut,
} from "./actions";

type Char = {
  id: string;
  name: string;
  emoji: string;
  avatar: string | null;
  align: "left" | "right";
};
type Msg = { key: string; characterId: string | null; kind: Kind; text: string };

const CHAR_EMOJIS = ["🙂", "😎", "😳", "😢", "😠", "😴", "🤍", "🐺", "🐱", "👑", "🌟", "👻", "🧑", "👩", "👨", "🧒"];
const KIND_LABEL: Record<Exclude<Kind, "narration">, string> = {
  dialogue: "대사",
  thought: "생각",
  monologue: "혼잣말",
};

// 업로드 사진을 정사각형에 가까운 작은 data URL로 축소
function fileToDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했어요."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("이미지를 열지 못했어요."));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("이미지를 처리하지 못했어요."));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function Editor({
  storyId,
  storyTitle,
  episodeId,
  initialTitle,
  published,
  initialCharacters,
  initialMessages,
}: {
  storyId: string;
  storyTitle: string;
  episodeId: string;
  initialTitle: string;
  published: boolean;
  initialCharacters: Char[];
  initialMessages: Msg[];
}) {
  const router = useRouter();
  const idc = useRef(0);
  const nk = () => `m${idc.current++}`;

  const [title, setTitle] = useState(initialTitle);
  const [chars, setChars] = useState<Char[]>(initialCharacters);
  const [msgs, setMsgs] = useState<Msg[]>(initialMessages);
  const [pub, setPub] = useState(published);

  const [activeId, setActiveId] = useState<string | null>(
    initialCharacters.find((c) => c.align === "right")?.id ??
      initialCharacters[0]?.id ??
      null,
  );
  const [mode, setMode] = useState<Kind>("dialogue");
  const [text, setText] = useState("");

  const [editing, setEditing] = useState<number | null>(null); // 메시지 편집 index
  const [charForm, setCharForm] = useState<null | {
    mode: "add" | "edit";
    id?: string;
    name: string;
    emoji: string;
    avatar: string | null;
    align: "left" | "right";
  }>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [preview, setPreview] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(true); // 변경 없음(=저장됨) 상태로 시작
  const [pending, startTransition] = useTransition();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  const [viewportH, setViewportH] = useState<number | null>(null);

  // 모바일 키보드가 열리면 보이는 영역만큼만 높이를 잡아 입력창이 가려지지 않게 함
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setViewportH(vv.height);
    onResize();
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  // 자동 저장: 대화/제목이 바뀌면 잠시 후 조용히 저장(글 유실 방지)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaved(false);
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => doSave(undefined, true), 2000);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
    // doSave는 최신 상태를 클로저로 읽으므로 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, title]);

  // 저장 안 된 변경이 있으면 이탈 전 경고
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (!saved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [saved]);

  const charById = (id: string | null) =>
    id ? chars.find((c) => c.id === id) : undefined;

  // ── 메시지 보내기 ──
  const send = () => {
    const t = text.trim();
    if (!t) return;
    if (mode !== "narration" && !activeId) {
      setError("먼저 말하는 인물을 골라주세요. (없으면 인물을 추가하세요)");
      return;
    }
    setError(null);
    setSaved(false);
    setMsgs((m) => [
      ...m,
      { key: nk(), characterId: mode === "narration" ? null : activeId, kind: mode, text: t },
    ]);
    setText("");
    inputRef.current?.focus();
  };

  // 화자 원터치 전환: 인물 목록을 순환 (2명이면 사실상 상대와 토글)
  const cycleSpeaker = () => {
    if (chars.length === 0) return;
    if (mode === "narration") {
      setMode("dialogue");
      setActiveId(chars[0].id);
      return;
    }
    const i = chars.findIndex((c) => c.id === activeId);
    const next = chars[(i + 1 + chars.length) % chars.length] ?? chars[0];
    setActiveId(next.id);
  };

  const onComposerKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === "Tab") {
      // Tab 으로 화자 전환 (Shift+Tab은 기본 포커스 이동 유지)
      if (!e.shiftKey && chars.length > 1) {
        e.preventDefault();
        cycleSpeaker();
      }
    }
  };

  // ── 메시지 편집 ──
  const patchMsg = (i: number, patch: Partial<Msg>) =>
    setMsgs((m) => m.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const removeMsg = (i: number) => setMsgs((m) => m.filter((_, j) => j !== i));
  const moveMsg = (i: number, dir: -1 | 1) =>
    setMsgs((m) => {
      const j = i + dir;
      if (j < 0 || j >= m.length) return m;
      const c = [...m];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  // ── 인물 저장 (즉시 서버 반영) ──
  const submitCharForm = () => {
    if (!charForm) return;
    const payload = {
      name: charForm.name,
      emoji: charForm.emoji,
      avatar: charForm.avatar,
      align: charForm.align,
    };
    setError(null);
    startTransition(async () => {
      try {
        let out: CharOut;
        if (charForm.mode === "edit" && charForm.id) {
          out = await updateCharacter(charForm.id, payload);
          setChars((cs) =>
            cs.map((c) =>
              c.id === out.id
                ? { id: out.id, name: out.name, emoji: out.emoji ?? "🙂", avatar: out.avatar, align: (out.align === "right" ? "right" : "left") }
                : c,
            ),
          );
        } else {
          out = await createCharacter(storyId, payload);
          const newChar: Char = {
            id: out.id,
            name: out.name,
            emoji: out.emoji ?? "🙂",
            avatar: out.avatar,
            align: out.align === "right" ? "right" : "left",
          };
          setChars((cs) => [...cs, newChar]);
          setActiveId(out.id);
          if (mode === "narration") setMode("dialogue");
        }
        setCharForm(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "인물 저장에 실패했어요.");
      }
    });
  };

  const removeChar = (id: string) => {
    startTransition(async () => {
      await deleteCharacter(id);
      setChars((cs) => cs.filter((c) => c.id !== id));
      setMsgs((m) =>
        m.map((x) => (x.characterId === id ? { ...x, characterId: null } : x)),
      );
      if (activeId === id) setActiveId(null);
    });
  };

  const onPickPhoto = async (file: File | undefined) => {
    if (!file || !charForm) return;
    try {
      const url = await fileToDataUrl(file);
      setCharForm({ ...charForm, avatar: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "사진 처리에 실패했어요.");
    }
  };

  // ── 저장/개시 ──
  // auto=true 이면 자동 저장(에러/이동 없이 조용히)
  const doSave = (publish: boolean | undefined, auto = false) => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (!auto) setError(null);
    startTransition(async () => {
      const res = await saveEpisode({
        episodeId,
        title,
        messages: msgs.map((m) => ({
          characterId: m.kind === "narration" ? null : m.characterId,
          kind: m.kind,
          text: m.text,
        })),
        publish,
      });
      if ("error" in res) {
        if (!auto) setError(res.error);
        return;
      }
      if (publish === true) {
        router.push(`/stories/${storyId}/episodes/${episodeId}`);
        router.refresh();
        return;
      }
      if (publish === false) setPub(false);
      setSaved(true);
      if (!auto) setPreview(false);
    });
  };

  const openAddChar = () => {
    setManageOpen(false);
    setCharForm({
      mode: "add",
      name: "",
      emoji: CHAR_EMOJIS[chars.length % CHAR_EMOJIS.length],
      avatar: null,
      align: chars.length === 0 ? "right" : "left",
    });
  };

  return (
    <main
      className="mx-auto flex h-[100dvh] max-w-2xl flex-col"
      style={viewportH ? { height: `${viewportH}px` } : undefined}
    >
      {/* 상단 바 */}
      <header className="flex items-center gap-2 border-b border-line bg-paper px-3 py-2.5">
        <Link
          href={`/stories/${storyId}`}
          className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-sunk hover:text-ink"
          aria-label="목차로"
        >
          <IconArrowLeft width={18} height={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaved(false);
            }}
            aria-label="화 제목"
            className="w-full rounded-md bg-transparent px-1 text-sm font-semibold text-ink outline-none focus:bg-paper-sunk"
            placeholder="화 제목 (예: 1화)"
          />
          <p className="truncate px-1 text-xs text-ink-faint">
            {storyTitle} {pub ? "· 공개됨" : "· 비공개"}
          </p>
        </div>
        <button
          onClick={() => setPreview(true)}
          className="btn-outline px-2.5 py-1.5 text-xs"
        >
          미리보기
        </button>
        <button
          onClick={() => doSave(undefined)}
          disabled={pending}
          className="btn-ghost px-2.5 py-1.5 text-xs"
          title="수동 저장 (자동 저장도 됩니다)"
        >
          {pending ? "저장 중…" : saved ? "저장됨 ✓" : "임시저장"}
        </button>
        {pub ? (
          <button
            onClick={() => doSave(false)}
            disabled={pending}
            className="btn-outline px-2.5 py-1.5 text-xs"
          >
            비공개로
          </button>
        ) : (
          <button
            onClick={() => doSave(true)}
            disabled={pending}
            className="btn-primary px-2.5 py-1.5 text-xs"
          >
            개시하기
          </button>
        )}
      </header>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto bg-paper-soft px-4 py-5">
        {msgs.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-ink-faint">
              아래 입력창에서 대사를 입력하면
              <br />
              메신저처럼 말풍선이 쌓여요.
            </p>
            {chars.length === 0 && (
              <button onClick={openAddChar} className="btn-primary">
                <IconPlus width={16} height={16} /> 먼저 인물 추가하기
              </button>
            )}
          </div>
        ) : (
          <ol className="space-y-3">
            {msgs.map((m, i) => (
              <li key={m.key} className={isGrouped(msgs, i) ? "-mt-2" : ""}>
                <button
                  onClick={() => setEditing(i)}
                  className="block w-full rounded-xl px-1 py-0.5 text-left transition hover:bg-paper-sunk"
                  aria-label={`${i + 1}번째 줄 수정`}
                >
                  <Bubble
                    kind={m.kind}
                    text={m.text}
                    char={charById(m.characterId)}
                    grouped={isGrouped(msgs, i)}
                  />
                </button>
              </li>
            ))}
          </ol>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      {/* 작성 도구 (항상 하단 고정) */}
      <div className="border-t border-line bg-paper px-3 pb-3 pt-2">
        {/* 인물 선택 줄 (인물 추가/편집 버튼은 항상 보이도록 스크롤 밖에 고정) */}
        <div className="mb-2 flex items-center gap-1.5">
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto pb-1">
            {chars.map((c) => {
              const active = mode !== "narration" && activeId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    if (mode === "narration") setMode("dialogue");
                  }}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs font-medium transition ${
                    active
                      ? "bg-brand-600 text-white"
                      : "bg-paper-sunk text-ink-soft hover:bg-line"
                  }`}
                  aria-pressed={active}
                >
                  <Avatar emoji={c.emoji} avatar={c.avatar} name={c.name} size={22} />
                  {c.name}
                  {c.align === "right" && <span className="opacity-70">(나)</span>}
                </button>
              );
            })}
            <button
              onClick={() => setMode("narration")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                mode === "narration"
                  ? "bg-ink text-white"
                  : "bg-paper-sunk text-ink-soft hover:bg-line"
              }`}
              aria-pressed={mode === "narration"}
            >
              지문
            </button>
          </div>
          {chars.length > 1 && (
            <button
              onClick={cycleSpeaker}
              className="flex shrink-0 items-center rounded-full p-1.5 text-ink-soft hover:bg-paper-sunk hover:text-brand-600"
              aria-label="다음 화자로 전환 (Tab)"
              title="화자 전환 (Tab)"
            >
              <IconSwap width={16} height={16} />
            </button>
          )}
          <button
            onClick={openAddChar}
            className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 py-1.5 text-xs text-ink-muted hover:bg-paper-sunk"
            aria-label="인물 추가"
          >
            <IconPlus width={13} height={13} /> 인물
          </button>
          {chars.length > 0 && (
            <button
              onClick={() => setManageOpen(true)}
              className="flex shrink-0 items-center rounded-full p-1.5 text-ink-faint hover:bg-paper-sunk hover:text-brand-600"
              aria-label="인물 편집·삭제"
              title="인물 편집·삭제"
            >
              <IconEdit width={16} height={16} />
            </button>
          )}
        </div>

        {/* 말풍선 종류 (지문이 아닐 때) */}
        {mode !== "narration" && (
          <div className="mb-2 flex gap-1" role="group" aria-label="말풍선 종류">
            {(Object.keys(KIND_LABEL) as Exclude<Kind, "narration">[]).map((k) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                aria-pressed={mode === k}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                  mode === k
                    ? "bg-brand-100 text-brand-700"
                    : "text-ink-muted hover:bg-paper-sunk"
                }`}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        )}

        {/* 입력 */}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onComposerKey}
            onFocus={() =>
              setTimeout(
                () => bottomRef.current?.scrollIntoView({ block: "end" }),
                250,
              )
            }
            rows={1}
            className="input max-h-32 min-h-[42px] flex-1 resize-none py-2.5"
            placeholder={
              mode === "narration"
                ? "상황 설명 / 지문을 입력 (Enter 전송)"
                : "대사를 입력하고 Enter로 전송 (Shift+Enter 줄바꿈)"
            }
            aria-label="내용 입력"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="btn-primary h-[42px] shrink-0 px-3.5"
            aria-label="보내기"
          >
            <IconSend width={18} height={18} />
          </button>
        </div>
      </div>

      {/* 메시지 편집 모달 */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="줄 수정"
        width="max-w-md"
      >
        {editing !== null && msgs[editing] && (
          <div className="space-y-3">
            <div className="flex gap-1" role="group" aria-label="말풍선 종류">
              {(["dialogue", "thought", "monologue", "narration"] as Kind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => patchMsg(editing, { kind: k })}
                  aria-pressed={msgs[editing].kind === k}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                    msgs[editing].kind === k
                      ? "bg-brand-100 text-brand-700"
                      : "bg-paper-sunk text-ink-muted"
                  }`}
                >
                  {k === "narration" ? "지문" : KIND_LABEL[k]}
                </button>
              ))}
            </div>
            {msgs[editing].kind !== "narration" && (
              <select
                className="input"
                value={msgs[editing].characterId ?? ""}
                onChange={(e) =>
                  patchMsg(editing, { characterId: e.target.value || null })
                }
                aria-label="화자"
              >
                <option value="">화자 선택</option>
                {chars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            )}
            <textarea
              className="input min-h-[70px]"
              value={msgs[editing].text}
              onChange={(e) => patchMsg(editing, { text: e.target.value })}
              aria-label="내용"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <button
                  onClick={() => moveMsg(editing, -1)}
                  disabled={editing === 0}
                  className="btn-outline px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↑ 위로
                </button>
                <button
                  onClick={() => moveMsg(editing, 1)}
                  disabled={editing === msgs.length - 1}
                  className="btn-outline px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↓ 아래로
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    removeMsg(editing);
                    setEditing(null);
                  }}
                  className="btn px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                >
                  <IconTrash width={14} height={14} /> 삭제
                </button>
                <button onClick={() => setEditing(null)} className="btn-primary px-3 py-1 text-xs">
                  <IconCheck width={14} height={14} /> 완료
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 인물 관리 모달 */}
      <Modal open={manageOpen} onClose={() => setManageOpen(false)} title="인물 관리">
        <ul className="space-y-2">
          {chars.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl bg-paper-soft p-2.5">
              <Avatar emoji={c.emoji} avatar={c.avatar} name={c.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                <p className="text-xs text-ink-faint">
                  {c.align === "right" ? "오른쪽 (나)" : "왼쪽"}
                </p>
              </div>
              <button
                onClick={() => {
                  setManageOpen(false);
                  setCharForm({
                    mode: "edit",
                    id: c.id,
                    name: c.name,
                    emoji: c.emoji,
                    avatar: c.avatar,
                    align: c.align,
                  });
                }}
                className="rounded-lg p-2 text-ink-faint hover:bg-brand-50 hover:text-brand-600"
                aria-label={`${c.name} 수정`}
              >
                <IconEdit width={16} height={16} />
              </button>
              <button
                onClick={() => removeChar(c.id)}
                className="rounded-lg p-2 text-ink-faint hover:bg-red-50 hover:text-red-500"
                aria-label={`${c.name} 삭제`}
              >
                <IconTrash width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
        <button onClick={openAddChar} className="btn-outline mt-3 w-full">
          <IconPlus width={15} height={15} /> 인물 추가
        </button>
      </Modal>

      {/* 인물 추가/수정 모달 */}
      <Modal
        open={!!charForm}
        onClose={() => setCharForm(null)}
        title={charForm?.mode === "edit" ? "인물 수정" : "인물 추가"}
        width="max-w-md"
      >
        {charForm && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar
                emoji={charForm.emoji}
                avatar={charForm.avatar}
                name={charForm.name}
                size={56}
              />
              <div className="flex flex-col gap-1.5">
                <label className="btn-outline cursor-pointer text-xs">
                  📷 사진 올리기
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickPhoto(e.target.files?.[0])}
                  />
                </label>
                {charForm.avatar && (
                  <button
                    onClick={() => setCharForm({ ...charForm, avatar: null })}
                    className="text-xs text-ink-faint hover:text-red-500"
                  >
                    사진 제거 (기본 프로필 사용)
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="cf-name">이름 *</label>
              <input
                id="cf-name"
                className="input"
                value={charForm.name}
                onChange={(e) => setCharForm({ ...charForm, name: e.target.value })}
                placeholder="예: 지호"
                autoFocus
              />
            </div>

            {!charForm.avatar && (
              <div>
                <span className="label">기본 프로필</span>
                <div className="flex flex-wrap gap-1">
                  {CHAR_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setCharForm({ ...charForm, emoji: e })}
                      aria-pressed={charForm.emoji === e}
                      className={`flex h-8 w-8 items-center justify-center rounded-md text-base ${
                        charForm.emoji === e
                          ? "bg-brand-100 ring-1 ring-brand-400"
                          : "hover:bg-paper-sunk"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="label">말풍선 위치</span>
              <div className="flex rounded-lg bg-paper-sunk p-0.5" role="group">
                {(["left", "right"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setCharForm({ ...charForm, align: a })}
                    aria-pressed={charForm.align === a}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                      charForm.align === a ? "bg-paper text-ink shadow-card" : "text-ink-muted"
                    }`}
                  >
                    {a === "left" ? "왼쪽 (상대)" : "오른쪽 (나)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-ghost" onClick={() => setCharForm(null)}>
                취소
              </button>
              <button
                className="btn-primary"
                onClick={submitCharForm}
                disabled={pending || !charForm.name.trim()}
              >
                {pending ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 미리보기 */}
      <Modal open={preview} onClose={() => setPreview(false)} title="미리보기">
        <div className="max-h-[60vh] overflow-y-auto rounded-xl bg-paper-soft p-4">
          {msgs.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-faint">
              아직 내용이 없어요.
            </p>
          ) : (
            <ol className="space-y-3">
              {msgs.map((m, i) => (
                <li key={m.key} className={isGrouped(msgs, i) ? "-mt-2" : ""}>
                  <Bubble
                    kind={m.kind}
                    text={m.text}
                    char={charById(m.characterId)}
                    grouped={isGrouped(msgs, i)}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setPreview(false)}>
            계속 쓰기
          </button>
          {!pub && (
            <button className="btn-primary" onClick={() => doSave(true)} disabled={pending}>
              {pending ? "개시 중…" : "이대로 개시하기"}
            </button>
          )}
        </div>
      </Modal>
    </main>
  );
}
