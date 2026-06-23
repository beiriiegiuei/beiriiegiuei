"use client";

import { useState } from "react";
import type { Act, Scene, Season } from "@prisma/client";
import { Modal } from "@/components/Modal";
import { IconPlus, IconTrash, IconEdit } from "@/components/icons";
import {
  deleteAct,
  deleteScene,
  deleteSeason,
  moveScene,
  saveAct,
  saveScene,
  saveSeason,
} from "./actions";

const STATUS: Record<string, { label: string; cls: string }> = {
  idea: { label: "아이디어", cls: "bg-slate-100 text-slate-500" },
  draft: { label: "초고", cls: "bg-blue-50 text-blue-600" },
  done: { label: "완료", cls: "bg-emerald-50 text-emerald-600" },
};

const UNSEASONED = "__unseasoned__";
const UNFILED = "__unfiled__";

export function BoardClient({
  projectId,
  seasons,
  acts,
  scenes,
}: {
  projectId: string;
  seasons: Season[];
  acts: Act[];
  scenes: Scene[];
}) {
  const unseasonedActs = acts.filter((a) => a.seasonId === null);
  const unfiledScenes = scenes.filter((s) => s.actId === null);
  const showUnseasoned = unseasonedActs.length > 0 || unfiledScenes.length > 0;

  const tabs: { id: string; title: string }[] = [
    ...seasons.map((s) => ({ id: s.id, title: s.title })),
    ...(showUnseasoned || seasons.length === 0
      ? [{ id: UNSEASONED, title: "시즌 미지정" }]
      : []),
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? UNSEASONED);
  const [sceneModal, setSceneModal] = useState<
    { actId: string | null } | Scene | null
  >(null);
  const [actModal, setActModal] = useState<Act | null | "new">(null);
  const [seasonModal, setSeasonModal] = useState<Season | null | "new">(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const current = tabs.find((t) => t.id === activeTab) ? activeTab : tabs[0]?.id ?? UNSEASONED;
  const activeSeason = seasons.find((s) => s.id === current) || null;

  // 현재 탭의 컬럼(아크)
  const columns: { id: string; act: Act | null; title: string }[] = (
    current === UNSEASONED
      ? unseasonedActs
      : acts.filter((a) => a.seasonId === current)
  ).map((a) => ({ id: a.id, act: a, title: a.title }));

  if (current === UNSEASONED) {
    columns.push({ id: UNFILED, act: null, title: "미분류 회차" });
  }

  const scenesOf = (colId: string) =>
    scenes
      .filter((s) => (colId === UNFILED ? s.actId === null : s.actId === colId))
      .sort((a, b) => a.order - b.order);

  const drop = async (colId: string, beforeSceneId: string | null) => {
    if (!dragId) return;
    const actId = colId === UNFILED ? null : colId;
    setOverCol(null);
    const id = dragId;
    setDragId(null);
    await moveScene(projectId, id, actId, beforeSceneId);
  };

  const epRange = (a: Act) =>
    a.epStart != null || a.epEnd != null
      ? `${a.epStart ?? "?"}–${a.epEnd ?? "?"}화`
      : null;

  return (
    <div className="flex h-screen flex-col px-5 py-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">스토리 구조</h1>
          <p className="mt-1 text-sm text-ink-muted">
            시즌 → 아크(시나리오) → 회차. 회차 카드를 드래그해 흐름을 짜보세요.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setSeasonModal("new")}>
            <IconPlus width={16} height={16} /> 시즌
          </button>
          <button className="btn-outline" onClick={() => setActModal("new")}>
            <IconPlus width={16} height={16} /> 아크
          </button>
        </div>
      </header>

      {/* 시즌 탭 */}
      <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-line pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`group flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2 text-sm font-medium transition ${
              current === t.id
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.title}
            {current === t.id && t.id !== UNSEASONED && activeSeason && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSeasonModal(activeSeason);
                }}
                className="rounded p-0.5 text-ink-faint hover:bg-paper-sunk hover:text-ink"
              >
                <IconEdit width={13} height={13} />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 보드 */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {columns.length === 0 ? (
          <div className="card flex h-40 w-full items-center justify-center text-sm text-ink-faint">
            이 시즌에 아크가 없어요. 상단의 “아크” 버튼으로 추가하세요.
          </div>
        ) : (
          columns.map((col) => {
            const colScenes = scenesOf(col.id);
            const isOver = overCol === col.id;
            return (
              <div
                key={col.id}
                className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-paper-sunk/60 transition ${
                  isOver ? "border-brand-400 bg-brand-50/50" : "border-line"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(col.id);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) setOverCol(null);
                }}
                onDrop={() => drop(col.id, null)}
              >
                <div className="flex items-start justify-between gap-1 px-3 py-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-ink">
                      {col.title}{" "}
                      <span className="text-ink-faint">{colScenes.length}</span>
                    </h2>
                    {col.act && epRange(col.act) && (
                      <span className="text-xs text-brand-600">{epRange(col.act)}</span>
                    )}
                    {col.act?.summary && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-faint">
                        {col.act.summary}
                      </p>
                    )}
                  </div>
                  {col.act && (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => setActModal(col.act)}
                        className="rounded-md p-1 text-ink-faint hover:bg-line hover:text-ink"
                        title="아크 편집"
                      >
                        <IconEdit width={14} height={14} />
                      </button>
                      <DeleteActButton projectId={projectId} act={col.act} />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2.5 pb-2">
                  {colScenes.map((s) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => setDragId(s.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setOverCol(col.id);
                      }}
                      onDrop={(e) => {
                        e.stopPropagation();
                        drop(col.id, s.id);
                      }}
                      onClick={() => setSceneModal(s)}
                      className={`card cursor-pointer p-3 transition hover:shadow-pop ${
                        dragId === s.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-ink">
                          {s.episodeNo != null && (
                            <span className="mr-1 text-brand-600">{s.episodeNo}화</span>
                          )}
                          {s.title}
                        </h3>
                        <span className={`chip shrink-0 ${STATUS[s.status || "idea"]?.cls}`}>
                          {STATUS[s.status || "idea"]?.label}
                        </span>
                      </div>
                      {s.summary && (
                        <p className="mt-1.5 line-clamp-3 text-xs text-ink-soft">
                          {s.summary}
                        </p>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() =>
                      setSceneModal({ actId: col.id === UNFILED ? null : col.id })
                    }
                    className="mt-1 flex items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong py-2 text-xs font-medium text-ink-muted transition hover:border-brand-400 hover:text-brand-600"
                  >
                    <IconPlus width={14} height={14} /> 회차
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {sceneModal !== null && (
        <SceneModal
          projectId={projectId}
          acts={acts}
          seasons={seasons}
          scene={"id" in sceneModal ? sceneModal : null}
          defaultActId={"id" in sceneModal ? sceneModal.actId : sceneModal.actId}
          onClose={() => setSceneModal(null)}
        />
      )}
      {actModal !== null && (
        <ActModal
          projectId={projectId}
          seasons={seasons}
          defaultSeasonId={current === UNSEASONED ? null : current}
          act={actModal === "new" ? null : actModal}
          onClose={() => setActModal(null)}
        />
      )}
      {seasonModal !== null && (
        <SeasonModal
          projectId={projectId}
          season={seasonModal === "new" ? null : seasonModal}
          onClose={() => setSeasonModal(null)}
        />
      )}
    </div>
  );
}

function DeleteActButton({ projectId, act }: { projectId: string; act: Act }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md p-1 text-ink-faint hover:bg-red-50 hover:text-red-500"
        title="아크 삭제"
      >
        <IconTrash width={14} height={14} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="아크 삭제" width="max-w-sm">
        <p className="text-sm text-ink-soft">
          <b>{act.title}</b> 아크를 삭제합니다. 안에 있던 회차는 <b>미분류</b>로 이동해요.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>
            취소
          </button>
          <form action={deleteAct.bind(null, projectId, act.id)}>
            <button className="btn bg-red-500 text-white hover:bg-red-600">삭제</button>
          </form>
        </div>
      </Modal>
    </>
  );
}

function SceneModal({
  projectId,
  acts,
  seasons,
  scene,
  defaultActId,
  onClose,
}: {
  projectId: string;
  acts: Act[];
  seasons: Season[];
  scene: Scene | null;
  defaultActId: string | null;
  onClose: () => void;
}) {
  const seasonTitle = (id: string | null) =>
    id ? seasons.find((s) => s.id === id)?.title || "시즌?" : "시즌 미지정";
  return (
    <Modal open onClose={onClose} title={scene ? "회차 편집" : "새 회차"} width="max-w-lg">
      <form
        action={async (fd) => {
          await saveScene(projectId, fd);
          onClose();
        }}
        className="space-y-4"
      >
        {scene && <input type="hidden" name="id" value={scene.id} />}
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3">
            <label className="label">회차 제목 *</label>
            <input
              name="title"
              required
              autoFocus
              defaultValue={scene?.title || ""}
              className="input"
              placeholder="예: 멈춘 도시에서 눈을 뜨다"
            />
          </div>
          <div>
            <label className="label">회차 번호</label>
            <input
              name="episodeNo"
              type="number"
              defaultValue={scene?.episodeNo != null ? String(scene.episodeNo) : ""}
              className="input"
              placeholder="48"
            />
          </div>
        </div>
        <div>
          <label className="label">내용 / 콘티</label>
          <textarea
            name="summary"
            defaultValue={scene?.summary || ""}
            rows={5}
            className="input resize-y"
            placeholder="이 회차에서 무슨 일이 일어나는지, 어떤 감정선인지"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">아크</label>
            <select name="actId" defaultValue={scene?.actId ?? defaultActId ?? ""} className="input">
              <option value="">미분류</option>
              {acts.map((a) => (
                <option key={a.id} value={a.id}>
                  [{seasonTitle(a.seasonId)}] {a.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">상태</label>
            <select name="status" defaultValue={scene?.status || "idea"} className="input">
              <option value="idea">아이디어</option>
              <option value="draft">초고</option>
              <option value="done">완료</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          {scene ? (
            <form
              action={async () => {
                await deleteScene(projectId, scene.id);
                onClose();
              }}
            >
              <button className="btn text-red-500 hover:bg-red-50">
                <IconTrash width={16} height={16} /> 삭제
              </button>
            </form>
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
    </Modal>
  );
}

function ActModal({
  projectId,
  seasons,
  defaultSeasonId,
  act,
  onClose,
}: {
  projectId: string;
  seasons: Season[];
  defaultSeasonId: string | null;
  act: Act | null;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={act ? "아크 편집" : "새 아크"} width="max-w-lg">
      <form
        action={async (fd) => {
          await saveAct(projectId, fd);
          onClose();
        }}
        className="space-y-4"
      >
        {act && <input type="hidden" name="id" value={act.id} />}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">아크 이름 *</label>
            <input
              name="title"
              required
              autoFocus
              defaultValue={act?.title || ""}
              className="input"
              placeholder="예: 시나리오2 · 배틀필드"
            />
          </div>
          <div>
            <label className="label">시즌</label>
            <select name="seasonId" defaultValue={act?.seasonId ?? defaultSeasonId ?? ""} className="input">
              <option value="">시즌 미지정</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">시작 회차</label>
            <input name="epStart" type="number" defaultValue={act?.epStart != null ? String(act.epStart) : ""} className="input" placeholder="48" />
          </div>
          <div>
            <label className="label">끝 회차</label>
            <input name="epEnd" type="number" defaultValue={act?.epEnd != null ? String(act.epEnd) : ""} className="input" placeholder="98" />
          </div>
        </div>
        <div>
          <label className="label">아크 요약</label>
          <textarea name="summary" defaultValue={act?.summary || ""} rows={3} className="input resize-y" placeholder="이 아크(시나리오)의 핵심 전개" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn-primary">
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SeasonModal({
  projectId,
  season,
  onClose,
}: {
  projectId: string;
  season: Season | null;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={season ? "시즌 편집" : "새 시즌"} width="max-w-sm">
      <form
        action={async (fd) => {
          await saveSeason(projectId, fd);
          onClose();
        }}
        className="space-y-4"
      >
        {season && <input type="hidden" name="id" value={season.id} />}
        <div>
          <label className="label">시즌 이름 *</label>
          <input
            name="title"
            required
            autoFocus
            defaultValue={season?.title || ""}
            className="input"
            placeholder="예: 시즌1 1부"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          {season ? (
            <form
              action={async () => {
                await deleteSeason(projectId, season.id);
                onClose();
              }}
            >
              <button className="btn text-red-500 hover:bg-red-50">
                <IconTrash width={16} height={16} /> 삭제
              </button>
            </form>
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
    </Modal>
  );
}
