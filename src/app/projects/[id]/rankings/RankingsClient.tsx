"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconRank,
  IconCopy,
  IconGrip,
} from "@/components/icons";
import {
  addEntry,
  deleteBoard,
  deleteEntry,
  deleteSnapshot,
  duplicateSnapshot,
  reorderEntry,
  saveBoard,
  saveSnapshot,
} from "./actions";

type CharLite = { id: string; name: string; emoji: string | null };
type EntryFull = {
  id: string;
  snapshotId: string;
  characterId: string | null;
  name: string | null;
  note: string | null;
  position: number;
  character: { id: string; name: string; emoji: string | null; color: string | null } | null;
};
type SnapshotFull = {
  id: string;
  boardId: string;
  label: string;
  order: number;
  entries: EntryFull[];
};
type BoardFull = {
  id: string;
  title: string;
  note: string | null;
  order: number;
  snapshots: SnapshotFull[];
};

const entryKey = (e: { characterId: string | null; name: string | null }) =>
  e.characterId ? `c:${e.characterId}` : `n:${(e.name || "").toLowerCase()}`;
const entryLabel = (e: EntryFull) => e.character?.name || e.name || "?";
const entryEmoji = (e: EntryFull) => e.character?.emoji || "•";

export function RankingsClient({
  projectId,
  boards,
  characters,
}: {
  projectId: string;
  boards: BoardFull[];
  characters: CharLite[];
}) {
  const [activeId, setActiveId] = useState(boards[0]?.id ?? null);
  const [boardModal, setBoardModal] = useState<BoardFull | null | "new">(null);
  const [snapModal, setSnapModal] = useState<
    | { mode: "new" | "dup"; boardId: string; snapshotId?: string; suggest?: string }
    | { mode: "edit"; snapshot: SnapshotFull }
    | null
  >(null);
  const [drag, setDrag] = useState<{ id: string; snapshotId: string } | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const active = boards.find((b) => b.id === activeId) || boards[0] || null;

  const doReorder = async (
    snapshotId: string,
    beforeEntryId: string | null
  ) => {
    if (!drag || drag.snapshotId !== snapshotId) return;
    const id = drag.id;
    setDrag(null);
    setOverId(null);
    await reorderEntry(projectId, snapshotId, id, beforeEntryId);
  };

  return (
    <div className="flex h-screen flex-col px-5 py-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">랭킹</h1>
          <p className="mt-1 text-sm text-ink-muted">
            시점별로 순위를 저장하고, 이전 시점 대비 변동을 자동으로 표시해요.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setBoardModal("new")}>
          <IconPlus width={16} height={16} /> 랭킹표
        </button>
      </header>

      {boards.length === 0 ? (
        <div className="card flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <IconRank width={40} height={40} className="text-brand-300" />
          <h2 className="text-lg font-semibold text-ink">첫 랭킹표를 만들어보세요</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            예: 월드 랭킹, 배틀필드 랭킹. 시즌 초반/후반처럼 시점을 나눠 순위 변동을 추적할 수 있어요.
          </p>
          <button className="btn-primary mt-1" onClick={() => setBoardModal("new")}>
            <IconPlus width={16} height={16} /> 랭킹표 추가
          </button>
        </div>
      ) : (
        <>
          {/* 랭킹표 탭 */}
          <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-line pb-px">
            {boards.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveId(b.id)}
                className={`group flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2 text-sm font-medium transition ${
                  active?.id === b.id
                    ? "border-brand-500 text-brand-700"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {b.title}
                {active?.id === b.id && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setBoardModal(b);
                    }}
                    className="rounded p-0.5 text-ink-faint hover:bg-paper-sunk hover:text-ink"
                  >
                    <IconEdit width={13} height={13} />
                  </span>
                )}
              </button>
            ))}
          </div>

          {active && (
            <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
              {active.snapshots.map((snap, i) => {
                const prev = i > 0 ? active.snapshots[i - 1] : null;
                const prevMap = new Map(
                  (prev?.entries || []).map((e) => [entryKey(e), e.position])
                );
                return (
                  <div
                    key={snap.id}
                    className="flex w-64 shrink-0 flex-col rounded-2xl border border-line bg-paper-sunk/60"
                  >
                    <div className="flex items-start justify-between gap-1 px-3 py-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-ink">
                          {snap.label}
                        </h2>
                        <span className="text-xs text-ink-faint">
                          {snap.entries.length}명
                          {i === 0 && " · 기준"}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={() =>
                            setSnapModal({
                              mode: "dup",
                              boardId: active.id,
                              snapshotId: snap.id,
                              suggest: nextLabel(snap.label),
                            })
                          }
                          className="rounded-md p-1 text-ink-faint hover:bg-line hover:text-brand-600"
                          title="이 시점을 복제해 다음 시점 만들기"
                        >
                          <IconCopy width={14} height={14} />
                        </button>
                        <button
                          onClick={() => setSnapModal({ mode: "edit", snapshot: snap })}
                          className="rounded-md p-1 text-ink-faint hover:bg-line hover:text-ink"
                          title="시점 이름 수정"
                        >
                          <IconEdit width={14} height={14} />
                        </button>
                        <DeleteSnapshotButton projectId={projectId} snapshot={snap} />
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-2">
                      {snap.entries.map((e) => {
                        const rank = e.position + 1;
                        const prevPos = prevMap.get(entryKey(e));
                        return (
                          <div
                            key={e.id}
                            draggable
                            onDragStart={() => setDrag({ id: e.id, snapshotId: snap.id })}
                            onDragEnd={() => {
                              setDrag(null);
                              setOverId(null);
                            }}
                            onDragOver={(ev) => {
                              if (drag?.snapshotId === snap.id) {
                                ev.preventDefault();
                                setOverId(e.id);
                              }
                            }}
                            onDrop={(ev) => {
                              ev.stopPropagation();
                              doReorder(snap.id, e.id);
                            }}
                            className={`group flex items-center gap-1.5 rounded-lg border bg-paper px-2 py-1.5 transition ${
                              drag?.id === e.id ? "opacity-40" : ""
                            } ${overId === e.id ? "border-brand-400" : "border-line"}`}
                          >
                            <span className="cursor-grab text-ink-faint active:cursor-grabbing">
                              <IconGrip width={14} height={14} />
                            </span>
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                              style={{
                                background:
                                  rank === 1
                                    ? "#fef3c7"
                                    : rank === 2
                                    ? "#e2e8f0"
                                    : rank === 3
                                    ? "#fde68a"
                                    : "#f3f1f6",
                                color: rank <= 3 ? "#92400e" : "#6b6878",
                              }}
                            >
                              {rank}
                            </span>
                            <span className="text-sm">{entryEmoji(e)}</span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-ink">
                                {entryLabel(e)}
                              </div>
                              {e.note && (
                                <div className="truncate text-[11px] text-ink-faint">
                                  {e.note}
                                </div>
                              )}
                            </div>
                            <Movement prevPos={prevPos} curPos={e.position} baseline={i === 0} />
                            <button
                              onClick={() => deleteEntry(projectId, e.id)}
                              className="rounded p-0.5 text-ink-faint opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                              title="삭제"
                            >
                              <IconTrash width={13} height={13} />
                            </button>
                          </div>
                        );
                      })}

                      {/* 맨 끝 드롭 영역 */}
                      <div
                        onDragOver={(ev) => {
                          if (drag?.snapshotId === snap.id) {
                            ev.preventDefault();
                            setOverId("end-" + snap.id);
                          }
                        }}
                        onDrop={() => doReorder(snap.id, null)}
                        className={`rounded-lg border border-dashed py-0.5 ${
                          overId === "end-" + snap.id ? "border-brand-400" : "border-transparent"
                        }`}
                      />

                      <AddEntryForm
                        projectId={projectId}
                        snapshotId={snap.id}
                        characters={characters}
                      />
                    </div>
                  </div>
                );
              })}

              {/* 새 시점 추가 컬럼 */}
              <button
                onClick={() => setSnapModal({ mode: "new", boardId: active.id })}
                className="flex h-full w-52 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-sm font-medium text-ink-muted transition hover:border-brand-400 hover:text-brand-600"
              >
                <IconPlus width={20} height={20} /> 새 시점
                <span className="px-4 text-center text-xs text-ink-faint">
                  또는 기존 시점의 복제(⧉) 아이콘으로 이전 랭킹을 복사하세요
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {boardModal !== null && (
        <BoardModal
          projectId={projectId}
          board={boardModal === "new" ? null : boardModal}
          onClose={() => setBoardModal(null)}
        />
      )}
      {snapModal !== null && (
        <SnapshotModal
          projectId={projectId}
          state={snapModal}
          onClose={() => setSnapModal(null)}
        />
      )}
    </div>
  );
}

function Movement({
  prevPos,
  curPos,
  baseline,
}: {
  prevPos: number | undefined;
  curPos: number;
  baseline: boolean;
}) {
  if (baseline) return null;
  if (prevPos === undefined)
    return <span className="chip bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">NEW</span>;
  const delta = prevPos - curPos; // 양수 = 순위 상승
  if (delta === 0)
    return <span className="text-[11px] font-semibold text-ink-faint">–</span>;
  if (delta > 0)
    return <span className="text-[11px] font-bold text-emerald-600">▲{delta}</span>;
  return <span className="text-[11px] font-bold text-red-500">▼{-delta}</span>;
}

function AddEntryForm({
  projectId,
  snapshotId,
  characters,
}: {
  projectId: string;
  snapshotId: string;
  characters: CharLite[];
}) {
  const [val, setVal] = useState("");
  const listId = `chars-${snapshotId}`;

  return (
    <form
      action={async (fd) => {
        const name = String(fd.get("name") || "").trim();
        if (!name) return;
        const match = characters.find((c) => c.name === name);
        if (match) {
          fd.set("characterId", match.id);
          fd.set("name", "");
        }
        await addEntry(projectId, snapshotId, fd);
        setVal("");
      }}
      className="mt-1 flex gap-1"
    >
      <input
        name="name"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        list={listId}
        placeholder="+ 이름 추가"
        className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-2 py-1 text-xs outline-none focus:border-brand-400"
      />
      <datalist id={listId}>
        {characters.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>
      <button type="submit" className="rounded-lg bg-brand-600 px-2 text-xs font-medium text-white hover:bg-brand-700">
        추가
      </button>
    </form>
  );
}

function DeleteSnapshotButton({
  projectId,
  snapshot,
}: {
  projectId: string;
  snapshot: SnapshotFull;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md p-1 text-ink-faint hover:bg-red-50 hover:text-red-500"
        title="시점 삭제"
      >
        <IconTrash width={14} height={14} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="시점 삭제" width="max-w-sm">
        <p className="text-sm text-ink-soft">
          <b>{snapshot.label}</b> 시점과 그 안의 순위를 삭제합니다.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>
            취소
          </button>
          <form action={deleteSnapshot.bind(null, projectId, snapshot.id)}>
            <button className="btn bg-red-500 text-white hover:bg-red-600">삭제</button>
          </form>
        </div>
      </Modal>
    </>
  );
}

function BoardModal({
  projectId,
  board,
  onClose,
}: {
  projectId: string;
  board: BoardFull | null;
  onClose: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <Modal open onClose={onClose} title={board ? "랭킹표 편집" : "새 랭킹표"} width="max-w-sm">
      <form
        action={async (fd) => {
          await saveBoard(projectId, fd);
          onClose();
        }}
        className="space-y-4"
      >
        {board && <input type="hidden" name="id" value={board.id} />}
        <div>
          <label className="label">랭킹표 이름 *</label>
          <input name="title" required autoFocus defaultValue={board?.title || ""} className="input" placeholder="예: 월드 랭킹" />
        </div>
        <div>
          <label className="label">설명 (선택)</label>
          <input name="note" defaultValue={board?.note || ""} className="input" placeholder="예: 전체 세계 기준 순위" />
        </div>
        <div className="flex items-center justify-between gap-2">
          {board ? (
            <button type="button" onClick={() => setConfirmDel(true)} className="btn text-red-500 hover:bg-red-50">
              <IconTrash width={16} height={16} /> 삭제
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              저장
            </button>
          </div>
        </div>
      </form>
      {board && (
        <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="랭킹표 삭제" width="max-w-sm">
          <p className="text-sm text-ink-soft">
            <b>{board.title}</b> 표와 모든 시점·순위가 삭제됩니다.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmDel(false)}>
              취소
            </button>
            <form
              action={async () => {
                await deleteBoard(projectId, board.id);
                onClose();
              }}
            >
              <button className="btn bg-red-500 text-white hover:bg-red-600">삭제</button>
            </form>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

function SnapshotModal({
  projectId,
  state,
  onClose,
}: {
  projectId: string;
  state:
    | { mode: "new" | "dup"; boardId: string; snapshotId?: string; suggest?: string }
    | { mode: "edit"; snapshot: SnapshotFull };
  onClose: () => void;
}) {
  const isEdit = state.mode === "edit";
  const isDup = state.mode === "dup";
  const title = isEdit ? "시점 이름 수정" : isDup ? "시점 복제" : "새 시점";
  const defaultLabel = isEdit
    ? state.snapshot.label
    : isDup
    ? state.suggest || ""
    : "";

  return (
    <Modal open onClose={onClose} title={title} width="max-w-sm">
      <form
        action={async (fd) => {
          const label = String(fd.get("label") || "").trim();
          if (isDup && state.mode === "dup" && state.snapshotId) {
            await duplicateSnapshot(projectId, state.snapshotId, label);
          } else if (isEdit && state.mode === "edit") {
            await saveSnapshot(projectId, state.snapshot.boardId, fd);
          } else if (state.mode === "new") {
            await saveSnapshot(projectId, state.boardId, fd);
          }
          onClose();
        }}
        className="space-y-4"
      >
        {isEdit && <input type="hidden" name="id" value={state.snapshot.id} />}
        {isDup && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
            선택한 시점의 순위를 그대로 복사해 새 시점을 만듭니다. 이후 몇 명만 드래그로 바꾸면 돼요.
          </p>
        )}
        <div>
          <label className="label">시점 이름 *</label>
          <input name="label" required autoFocus defaultValue={defaultLabel} className="input" placeholder="예: 시즌1 후반" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn-primary">
            {isDup ? "복제" : "저장"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// "시즌1 초반" → "시즌1 후반" 정도의 가벼운 제안
function nextLabel(label: string) {
  if (label.includes("초반")) return label.replace("초반", "후반");
  if (label.includes("전반")) return label.replace("전반", "후반");
  const m = label.match(/(\d+)\s*$/);
  if (m) return label.replace(/(\d+)\s*$/, String(Number(m[1]) + 1));
  return label + " 이후";
}
