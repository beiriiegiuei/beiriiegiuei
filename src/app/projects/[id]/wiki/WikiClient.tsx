"use client";

import { Fragment, useMemo, useState } from "react";
import type { WikiPage } from "@prisma/client";
import { Modal } from "@/components/Modal";
import { IconPlus, IconTrash, IconWiki, IconEdit } from "@/components/icons";
import { createWikiPage, deleteWikiPage, updateWikiPage } from "./actions";

export function WikiClient({
  projectId,
  pages,
}: {
  projectId: string;
  pages: WikiPage[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    pages[0]?.id ?? null
  );
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const selected =
    pages.find((p) => p.id === selectedId) ?? pages[0] ?? null;

  // 카테고리별 그룹
  const grouped = useMemo(() => {
    const m = new Map<string, WikiPage[]>();
    for (const p of pages) {
      const k = p.category || "일반";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    return [...m.entries()];
  }, [pages]);

  const titleToId = useMemo(
    () => new Map(pages.map((p) => [p.title.toLowerCase(), p.id])),
    [pages]
  );

  // 백링크: 이 페이지를 [[참조]]하는 다른 페이지
  const backlinks = useMemo(() => {
    if (!selected) return [];
    const needle = `[[${selected.title}]]`.toLowerCase();
    return pages.filter(
      (p) =>
        p.id !== selected.id &&
        (p.content || "").toLowerCase().includes(needle)
    );
  }, [pages, selected]);

  return (
    <div className="flex h-screen">
      {/* 페이지 목록 */}
      <div className="flex w-60 shrink-0 flex-col border-r border-line bg-paper">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="font-bold text-ink">세계관 위키</h1>
          <button
            onClick={() => setCreating(true)}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-paper-sunk hover:text-brand-600"
            title="새 문서"
          >
            <IconPlus width={18} height={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {pages.length === 0 ? (
            <p className="px-2 py-4 text-xs text-ink-faint">
              아직 문서가 없어요.
            </p>
          ) : (
            grouped.map(([cat, ps]) => (
              <div key={cat} className="mb-3">
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  {cat}
                </div>
                {ps.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      setEditing(false);
                    }}
                    className={`block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                      selected?.id === p.id
                        ? "bg-brand-50 font-medium text-brand-700"
                        : "text-ink-soft hover:bg-paper-sunk"
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="min-w-0 flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <IconWiki width={40} height={40} className="text-brand-300" />
            <h2 className="text-lg font-semibold text-ink">세계관을 기록해보세요</h2>
            <p className="max-w-xs text-sm text-ink-muted">
              지명, 마법 체계, 세력, 연표… <code>[[문서명]]</code> 으로 문서끼리
              연결할 수 있어요.
            </p>
            <button className="btn-primary mt-1" onClick={() => setCreating(true)}>
              <IconPlus width={16} height={16} /> 첫 문서 만들기
            </button>
          </div>
        ) : editing ? (
          <WikiEditor
            key={selected.id}
            projectId={projectId}
            page={selected}
            onDone={() => setEditing(false)}
          />
        ) : (
          <article className="mx-auto max-w-2xl px-6 py-8 sm:px-10">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-500">
              {selected.category}
            </div>
            <div className="mb-6 flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold text-ink">{selected.title}</h1>
              <div className="flex shrink-0 gap-1">
                <button
                  className="btn-outline"
                  onClick={() => setEditing(true)}
                >
                  <IconEdit width={15} height={15} /> 편집
                </button>
                <button
                  onClick={() => setConfirmDel(true)}
                  className="btn-outline text-red-500 hover:bg-red-50"
                  title="삭제"
                >
                  <IconTrash width={15} height={15} />
                </button>
              </div>
            </div>

            {selected.content?.trim() ? (
              <MarkdownView
                content={selected.content}
                titleToId={titleToId}
                onNavigate={(id) => {
                  setSelectedId(id);
                  setEditing(false);
                }}
                onCreateMissing={(t) => createAndOpen(t)}
              />
            ) : (
              <p className="text-ink-faint">
                내용이 비어 있어요. <b>편집</b>을 눌러 작성해보세요.
              </p>
            )}

            {backlinks.length > 0 && (
              <div className="mt-10 border-t border-line pt-5">
                <h3 className="mb-2 text-sm font-semibold text-ink-muted">
                  🔗 이 문서를 언급하는 문서
                </h3>
                <div className="flex flex-wrap gap-2">
                  {backlinks.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedId(b.id)}
                      className="chip bg-paper-sunk text-ink-soft hover:bg-brand-50 hover:text-brand-700"
                    >
                      {b.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </div>

      {/* 새 문서 */}
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="새 문서"
        width="max-w-sm"
      >
        <form
          action={async (fd) => {
            const id = await createWikiPage(projectId, fd);
            setCreating(false);
            if (id) {
              setSelectedId(id);
              setEditing(true);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">문서 제목 *</label>
            <input name="title" required autoFocus className="input" placeholder="예: 아르카디아 왕국" />
          </div>
          <div>
            <label className="label">카테고리</label>
            <input name="category" className="input" placeholder="예: 지명 / 세력 / 마법" defaultValue="일반" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              만들기
            </button>
          </div>
        </form>
      </Modal>

      {/* 삭제 확인 */}
      {selected && (
        <Modal
          open={confirmDel}
          onClose={() => setConfirmDel(false)}
          title="문서 삭제"
          width="max-w-sm"
        >
          <p className="text-sm text-ink-soft">
            <b>{selected.title}</b> 문서를 삭제할까요?
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmDel(false)}>
              취소
            </button>
            <form
              action={async () => {
                await deleteWikiPage(projectId, selected.id);
                setConfirmDel(false);
                setSelectedId(null);
              }}
            >
              <button className="btn bg-red-500 text-white hover:bg-red-600">삭제</button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );

  async function createAndOpen(title: string) {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("category", "일반");
    const id = await createWikiPage(projectId, fd);
    if (id) {
      setSelectedId(id);
      setEditing(true);
    }
  }
}

function WikiEditor({
  projectId,
  page,
  onDone,
}: {
  projectId: string;
  page: WikiPage;
  onDone: () => void;
}) {
  return (
    <form
      action={async (fd) => {
        await updateWikiPage(projectId, fd);
        onDone();
      }}
      className="mx-auto flex h-full max-w-2xl flex-col px-6 py-8 sm:px-10"
    >
      <input type="hidden" name="id" value={page.id} />
      <div className="mb-3 grid grid-cols-3 gap-2">
        <input
          name="title"
          required
          defaultValue={page.title}
          className="input col-span-2 text-lg font-semibold"
          placeholder="문서 제목"
        />
        <input
          name="category"
          defaultValue={page.category || "일반"}
          className="input"
          placeholder="카테고리"
        />
      </div>
      <textarea
        name="content"
        defaultValue={page.content || ""}
        className="input min-h-[50vh] flex-1 resize-none font-mono text-sm leading-relaxed"
        placeholder={"# 제목\n\n**굵게**, - 목록, 그리고 [[다른 문서]] 링크를 쓸 수 있어요."}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-ink-faint">
          서식: <code># 제목</code> · <code>**굵게**</code> · <code>- 목록</code> ·{" "}
          <code>[[문서 연결]]</code>
        </span>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={onDone}>
            취소
          </button>
          <button type="submit" className="btn-primary">
            저장
          </button>
        </div>
      </div>
    </form>
  );
}

/* ---- 경량 마크다운 렌더러 ---- */
function MarkdownView({
  content,
  titleToId,
  onNavigate,
  onCreateMissing,
}: {
  content: string;
  titleToId: Map<string, string>;
  onNavigate: (id: string) => void;
  onCreateMissing: (title: string) => void;
}) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (list.length) {
      blocks.push(
        <ul key={key} className="my-3 list-disc space-y-1 pl-5 text-ink-soft">
          {list}
        </ul>
      );
      list = [];
    }
  };

  const inline = (text: string, key: string) => {
    // [[wikilink]] 및 **bold** 처리
    const parts = text.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const name = part.slice(2, -2).trim();
        const targetId = titleToId.get(name.toLowerCase());
        return (
          <button
            key={`${key}-${i}`}
            onClick={() =>
              targetId ? onNavigate(targetId) : onCreateMissing(name)
            }
            className={`font-medium underline decoration-dotted underline-offset-2 ${
              targetId
                ? "text-brand-600 hover:text-brand-700"
                : "text-red-500 hover:text-red-600"
            }`}
            title={targetId ? "" : "새 문서로 만들기"}
          >
            {name}
          </button>
        );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={`${key}-${i}`} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <Fragment key={`${key}-${i}`}>{part}</Fragment>;
    });
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const key = `l${i}`;
    if (/^### /.test(line)) {
      flushList(key + "u");
      blocks.push(
        <h3 key={key} className="mb-1 mt-5 text-lg font-bold text-ink">
          {inline(line.slice(4), key)}
        </h3>
      );
    } else if (/^## /.test(line)) {
      flushList(key + "u");
      blocks.push(
        <h2 key={key} className="mb-2 mt-6 text-xl font-bold text-ink">
          {inline(line.slice(3), key)}
        </h2>
      );
    } else if (/^# /.test(line)) {
      flushList(key + "u");
      blocks.push(
        <h1 key={key} className="mb-2 mt-6 text-2xl font-bold text-ink">
          {inline(line.slice(2), key)}
        </h1>
      );
    } else if (/^[-*] /.test(line)) {
      list.push(<li key={key}>{inline(line.slice(2), key)}</li>);
    } else if (line.trim() === "") {
      flushList(key + "u");
    } else {
      flushList(key + "u");
      blocks.push(
        <p key={key} className="my-2 leading-relaxed text-ink-soft">
          {inline(line, key)}
        </p>
      );
    }
  });
  flushList("end");

  return <div className="text-[15px]">{blocks}</div>;
}
