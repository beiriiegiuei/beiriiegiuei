"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { IconPlus, IconTrash, IconShield, IconCrown } from "@/components/icons";
import {
  deleteFaction,
  deleteFactionRelation,
  saveFaction,
  saveFactionRelation,
} from "./actions";

type CharLite = { id: string; name: string; emoji: string | null };
type MemberLite = CharLite & { rank: number | null };
type FactionFull = {
  id: string;
  name: string;
  element: string | null;
  emoji: string | null;
  color: string | null;
  summary: string | null;
  description: string | null;
  leaderId: string | null;
  parentId: string | null;
  leader: CharLite | null;
  members: MemberLite[];
  _count: { members: number };
};
type FRel = {
  id: string;
  fromId: string;
  toId: string;
  label: string | null;
  kind: string | null;
  description: string | null;
};

const FREL_META: Record<string, { label: string; color: string; cls: string }> = {
  ally: { label: "동맹", color: "#10b981", cls: "bg-emerald-50 text-emerald-700" },
  rival: { label: "적대", color: "#ef4444", cls: "bg-red-50 text-red-600" },
  subordinate: { label: "산하", color: "#f59e0b", cls: "bg-amber-50 text-amber-700" },
  neutral: { label: "중립/기타", color: "#94a3b8", cls: "bg-slate-100 text-slate-500" },
};
const COLORS = [
  "#7c54f5", "#ec4899", "#ef4444", "#f59e0b", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#64748b", "#0ea5e9",
];
const EMOJIS = ["⚔️", "🛡️", "👑", "🏰", "🐺", "🦅", "🔥", "❄️", "⚡", "🌑", "🩸", "🌟"];

export function FactionsClient({
  projectId,
  factions,
  relations,
  characters,
}: {
  projectId: string;
  factions: FactionFull[];
  relations: FRel[];
  characters: CharLite[];
}) {
  const [editing, setEditing] = useState<FactionFull | null | "new">(null);
  const [relEditing, setRelEditing] = useState<FRel | null | "new">(null);

  const nameOf = (id: string) => factions.find((f) => f.id === id)?.name || "?";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">세력 · 조직</h1>
          <p className="mt-1 text-sm text-ink-muted">
            세력 {factions.length}개 · 관계 {relations.length}개
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing("new")}>
          <IconPlus width={16} height={16} /> 세력
        </button>
      </header>

      {factions.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <IconShield width={36} height={36} className="text-brand-300" />
          <h2 className="text-lg font-semibold text-ink">세력을 만들어보세요</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            길드·가문·국가·조직… 속성과 수장, 소속 인물, 산하 구조까지 한눈에 정리하세요.
          </p>
          <button className="btn-primary mt-1" onClick={() => setEditing("new")}>
            <IconPlus width={16} height={16} /> 세력 추가
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factions.map((f) => (
            <button
              key={f.id}
              onClick={() => setEditing(f)}
              className="card group p-5 text-left transition hover:-translate-y-0.5 hover:shadow-pop"
              style={{ borderTopColor: f.color || "#7c54f5", borderTopWidth: 3 }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: (f.color || "#7c54f5") + "1f" }}
                >
                  {f.emoji || "⚔️"}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink">{f.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                    {f.element && (
                      <span className="chip bg-paper-sunk">{f.element}</span>
                    )}
                    <span>구성원 {f._count.members}</span>
                  </div>
                </div>
              </div>
              {f.parentId && (
                <p className="mt-2 text-xs text-ink-faint">
                  ↳ 산하: <b className="text-ink-muted">{nameOf(f.parentId)}</b>
                </p>
              )}
              {f.leader && (
                <p className="mt-2 flex items-center gap-1 text-sm text-ink-soft">
                  <IconCrown width={14} height={14} className="text-amber-500" />
                  {f.leader.emoji} {f.leader.name}
                </p>
              )}
              {f.summary && (
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{f.summary}</p>
              )}
              {f.members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {f.members.slice(0, 6).map((m) => (
                    <span key={m.id} className="chip bg-paper-sunk text-ink-muted">
                      {m.emoji} {m.name}
                    </span>
                  ))}
                  {f.members.length > 6 && (
                    <span className="chip bg-paper-sunk text-ink-faint">
                      +{f.members.length - 6}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 세력 간 관계 */}
      <div className="card mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">세력 간 관계</h2>
          <button
            className="btn-outline"
            onClick={() => setRelEditing("new")}
            disabled={factions.length < 2}
          >
            <IconPlus width={16} height={16} /> 관계 추가
          </button>
        </div>
        {relations.length === 0 ? (
          <p className="text-sm text-ink-faint">
            {factions.length < 2
              ? "세력이 2개 이상이어야 관계를 만들 수 있어요."
              : "아직 세력 간 관계가 없어요. (동맹 · 적대 · 산하 등)"}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {relations.map((r) => {
              const meta = FREL_META[r.kind || "neutral"];
              return (
                <li key={r.id} className="flex items-center gap-2 py-2.5 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: meta.color }}
                  />
                  <span className="font-medium text-ink">{nameOf(r.fromId)}</span>
                  <span className="text-ink-faint">→</span>
                  <span className="font-medium text-ink">{nameOf(r.toId)}</span>
                  <span className={`chip ${meta.cls}`}>{r.label || meta.label}</span>
                  {r.description && (
                    <span className="truncate text-xs text-ink-faint">
                      {r.description}
                    </span>
                  )}
                  <button
                    onClick={() => setRelEditing(r)}
                    className="ml-auto text-xs text-brand-600 hover:underline"
                  >
                    편집
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing !== null && (
        <FactionModal
          projectId={projectId}
          faction={editing === "new" ? null : editing}
          factions={factions}
          characters={characters}
          onClose={() => setEditing(null)}
        />
      )}
      {relEditing !== null && (
        <FactionRelationModal
          projectId={projectId}
          factions={factions}
          relation={relEditing === "new" ? null : relEditing}
          onClose={() => setRelEditing(null)}
        />
      )}
    </div>
  );
}

function FactionModal({
  projectId,
  faction,
  factions,
  characters,
  onClose,
}: {
  projectId: string;
  faction: FactionFull | null;
  factions: FactionFull[];
  characters: CharLite[];
  onClose: () => void;
}) {
  const [emoji, setEmoji] = useState(faction?.emoji || "⚔️");
  const [color, setColor] = useState(faction?.color || "#7c54f5");
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <Modal open onClose={onClose} title={faction ? "세력 편집" : "새 세력"} width="max-w-xl">
      <form
        action={async (fd) => {
          await saveFaction(projectId, fd);
          onClose();
        }}
        className="space-y-4"
      >
        {faction && <input type="hidden" name="id" value={faction.id} />}
        <input type="hidden" name="emoji" value={emoji} />
        <input type="hidden" name="color" value={color} />

        <div className="flex flex-wrap items-center gap-4">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
            style={{ background: color + "1f" }}
          >
            {emoji}
          </span>
          <div className="flex-1">
            <div className="mb-1.5 flex flex-wrap gap-1">
              {EMOJIS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`h-7 w-7 rounded-md text-base transition ${
                    emoji === e ? "bg-brand-100 ring-1 ring-brand-400" : "hover:bg-paper-sunk"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition ${
                    color === c ? "ring-2 ring-offset-2 ring-ink/30" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">세력 이름 *</label>
            <input name="name" required defaultValue={faction?.name} className="input" placeholder="예: 15정각" />
          </div>
          <div>
            <label className="label">속성 / 계열</label>
            <input name="element" defaultValue={faction?.element || ""} className="input" placeholder="예: 검류 / 전기" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">수장 / 리더</label>
            <select name="leaderId" defaultValue={faction?.leaderId || ""} className="input">
              <option value="">없음</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">상위 세력 (산하 구조)</label>
            <select name="parentId" defaultValue={faction?.parentId || ""} className="input">
              <option value="">없음 (최상위)</option>
              {factions
                .filter((f) => f.id !== faction?.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.emoji} {f.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">한 줄 요약</label>
          <input name="summary" defaultValue={faction?.summary || ""} className="input" placeholder="이 세력을 한 줄로" />
        </div>
        <div>
          <label className="label">설명 / 역사</label>
          <textarea name="description" defaultValue={faction?.description || ""} rows={4} className="input resize-y" placeholder="세력의 목적·역사·구조 등" />
        </div>

        {faction && faction.members.length > 0 && (
          <div>
            <span className="label">소속 인물 ({faction.members.length})</span>
            <div className="flex flex-wrap gap-1.5">
              {faction.members.map((m) => (
                <span key={m.id} className="chip bg-paper-sunk text-ink-muted">
                  {m.emoji} {m.name}
                  {m.rank ? ` · ${m.rank}위` : ""}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              소속은 인물 카드의 "소속 세력"에서 지정해요.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          {faction ? (
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

      {faction && (
        <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="세력 삭제" width="max-w-sm">
          <p className="text-sm text-ink-soft">
            <b>{faction.name}</b> 세력을 삭제합니다. 소속 인물은 "소속 없음"이 되고,
            연결된 세력 관계도 삭제돼요.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmDel(false)}>
              취소
            </button>
            <form
              action={async () => {
                await deleteFaction(projectId, faction.id);
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

function FactionRelationModal({
  projectId,
  factions,
  relation,
  onClose,
}: {
  projectId: string;
  factions: FactionFull[];
  relation: FRel | null;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={relation ? "세력 관계 편집" : "새 세력 관계"} width="max-w-md">
      <form
        action={async (fd) => {
          await saveFactionRelation(projectId, fd);
          onClose();
        }}
        className="space-y-4"
      >
        {relation && <input type="hidden" name="id" value={relation.id} />}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">세력 A</label>
            <select name="fromId" defaultValue={relation?.fromId} className="input" required>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.emoji} {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">세력 B</label>
            <select name="toId" defaultValue={relation?.toId} className="input" required>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.emoji} {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">관계명</label>
            <input name="label" defaultValue={relation?.label || ""} className="input" placeholder="예: 숙적 / 동맹" />
          </div>
          <div>
            <label className="label">유형</label>
            <select name="kind" defaultValue={relation?.kind || "neutral"} className="input">
              {Object.entries(FREL_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">설명</label>
          <textarea name="description" defaultValue={relation?.description || ""} rows={2} className="input resize-y" />
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          {relation ? (
            <form
              action={async () => {
                await deleteFactionRelation(projectId, relation.id);
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
