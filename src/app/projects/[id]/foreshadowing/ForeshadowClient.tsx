"use client";

import { useState } from "react";
import type { Foreshadow } from "@prisma/client";
import { Modal } from "@/components/Modal";
import { IconHook, IconPlus, IconTrash } from "@/components/icons";
import {
  deleteForeshadow,
  saveForeshadow,
  setForeshadowStatus,
} from "./actions";

type Scene = { id: string; title: string };

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  planted: { label: "심음 (미회수)", cls: "bg-amber-50 text-amber-700", dot: "#f59e0b" },
  resolved: { label: "회수 완료", cls: "bg-emerald-50 text-emerald-700", dot: "#10b981" },
  abandoned: { label: "폐기", cls: "bg-slate-100 text-slate-500", dot: "#94a3b8" },
};
const IMPORTANCE = ["", "낮음", "보통", "핵심"];

export function ForeshadowClient({
  projectId,
  foreshadows,
  scenes,
}: {
  projectId: string;
  foreshadows: Foreshadow[];
  scenes: Scene[];
}) {
  const [editing, setEditing] = useState<Foreshadow | null | "new">(null);
  const [filter, setFilter] = useState<"all" | "planted" | "resolved">("all");

  const sceneName = (id: string | null) =>
    id ? scenes.find((s) => s.id === id)?.title || "삭제된 장면" : null;

  const resolved = foreshadows.filter((f) => f.status === "resolved").length;
  const planted = foreshadows.filter((f) => f.status === "planted").length;
  const rate =
    foreshadows.length > 0
      ? Math.round((resolved / foreshadows.length) * 100)
      : 0;

  const filtered = foreshadows.filter((f) =>
    filter === "all" ? true : f.status === filter
  );

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">떡밥 추적기</h1>
          <p className="mt-1 text-sm text-ink-muted">
            복선을 심고 회수까지 놓치지 않게 추적하세요.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing("new")}>
          <IconPlus width={16} height={16} /> 떡밥
        </button>
      </header>

      {/* 진행률 */}
      <div className="card mb-6 p-5">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold text-brand-600">{rate}%</span>
            <span className="ml-2 text-sm text-ink-muted">회수율</span>
          </div>
          <span className="text-sm text-ink-muted">
            전체 {foreshadows.length} · 미회수 {planted} · 회수 {resolved}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-paper-sunk">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-4 flex gap-1.5">
        {([
          ["all", "전체"],
          ["planted", "미회수"],
          ["resolved", "회수됨"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === k
                ? "bg-brand-600 text-white"
                : "bg-paper text-ink-muted hover:bg-paper-sunk"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <IconHook width={36} height={36} className="text-brand-300" />
          <h2 className="text-lg font-semibold text-ink">떡밥이 없어요</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            복선·미스터리·암시를 등록해두면 어디서 심고 회수했는지 한눈에 보여요.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((f) => {
            const meta = STATUS_META[f.status] || STATUS_META.planted;
            return (
              <li
                key={f.id}
                className="card p-4 transition hover:shadow-pop"
              >
                <div className="flex items-start gap-3">
                  <button
                    title="회수 토글"
                    onClick={() =>
                      setForeshadowStatus(
                        projectId,
                        f.id,
                        f.status === "resolved" ? "planted" : "resolved"
                      )
                    }
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      f.status === "resolved"
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-line-strong hover:border-brand-400"
                    }`}
                  >
                    {f.status === "resolved" && "✓"}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setEditing(f)}
                        className="text-left font-semibold text-ink hover:text-brand-600"
                      >
                        {f.title}
                      </button>
                      <span className={`chip ${meta.cls}`}>{meta.label}</span>
                      {f.importance === 3 && (
                        <span className="chip bg-red-50 text-red-600">핵심</span>
                      )}
                    </div>
                    {f.description && (
                      <p className="mt-1 text-sm text-ink-soft">{f.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
                      <span>
                        🌱 심은 곳:{" "}
                        <b className="font-medium text-ink-muted">
                          {sceneName(f.plantedSceneId) || "미지정"}
                        </b>
                      </span>
                      <span>
                        🎣 회수:{" "}
                        <b className="font-medium text-ink-muted">
                          {sceneName(f.resolvedSceneId) || "미지정"}
                        </b>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(f)}
                    className="shrink-0 text-xs text-brand-600 hover:underline"
                  >
                    편집
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing !== null && (
        <ForeshadowModal
          projectId={projectId}
          scenes={scenes}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ForeshadowModal({
  projectId,
  scenes,
  item,
  onClose,
}: {
  projectId: string;
  scenes: Scene[];
  item: Foreshadow | null;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={item ? "떡밥 편집" : "새 떡밥"} width="max-w-lg">
      <form
        action={async (fd) => {
          await saveForeshadow(projectId, fd);
          onClose();
        }}
        className="space-y-4"
      >
        {item && <input type="hidden" name="id" value={item.id} />}
        <div>
          <label className="label">떡밥 제목 *</label>
          <input
            name="title"
            required
            defaultValue={item?.title || ""}
            className="input"
            placeholder="예: 주인공 목에 난 흉터의 정체"
          />
        </div>
        <div>
          <label className="label">설명</label>
          <textarea
            name="description"
            defaultValue={item?.description || ""}
            rows={3}
            className="input resize-y"
            placeholder="어떤 복선인지, 어떻게 회수할 계획인지"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">중요도</label>
            <select name="importance" defaultValue={item?.importance ?? 2} className="input">
              <option value={1}>낮음</option>
              <option value={2}>보통</option>
              <option value={3}>핵심</option>
            </select>
          </div>
          <div>
            <label className="label">상태</label>
            <select name="status" defaultValue={item?.status || "planted"} className="input">
              <option value="planted">심음 (미회수)</option>
              <option value="resolved">회수 완료</option>
              <option value="abandoned">폐기</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">심은 장면</label>
            <select name="plantedSceneId" defaultValue={item?.plantedSceneId || ""} className="input">
              <option value="">미지정</option>
              {scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">회수 장면</label>
            <select name="resolvedSceneId" defaultValue={item?.resolvedSceneId || ""} className="input">
              <option value="">미지정</option>
              {scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        {scenes.length === 0 && (
          <p className="text-xs text-ink-faint">
            💡 콘티 보드에서 장면을 만들면 떡밥을 장면에 연결할 수 있어요.
          </p>
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          {item ? (
            <form
              action={async () => {
                await deleteForeshadow(projectId, item.id);
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
