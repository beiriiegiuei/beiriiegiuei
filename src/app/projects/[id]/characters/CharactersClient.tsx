"use client";

import { useState } from "react";
import type { Character, Relationship } from "@prisma/client";
import { Modal } from "@/components/Modal";
import { IconPlus, IconTrash, IconUsers } from "@/components/icons";
import { RelationshipGraph, KIND_META } from "./RelationshipGraph";
import {
  deleteCharacter,
  deleteRelationship,
  saveCharacter,
  saveRelationship,
} from "./actions";

const COLORS = [
  "#7c54f5", "#ec4899", "#ef4444", "#f59e0b", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#64748b", "#0ea5e9",
];
const EMOJIS = [
  "🧑", "👩", "👨", "🧙", "🧛", "👸", "🤴", "🦸", "🦹", "🧝",
  "👺", "🐺", "🐉", "🤖", "👻", "😈", "👑", "⚔️", "🗡️", "🌙",
];

type FactionLite = { id: string; name: string; emoji: string | null };

const LIFE_META: Record<string, { label: string; cls: string }> = {
  alive: { label: "생존", cls: "bg-emerald-50 text-emerald-700" },
  dead: { label: "사망", cls: "bg-slate-200 text-slate-600" },
  revived: { label: "환생/부활", cls: "bg-violet-50 text-violet-700" },
  unknown: { label: "불명", cls: "bg-amber-50 text-amber-700" },
};

export function CharactersClient({
  projectId,
  characters,
  relationships,
  factions,
}: {
  projectId: string;
  characters: Character[];
  relationships: Relationship[];
  factions: FactionLite[];
}) {
  const factionName = (id: string | null) =>
    id ? factions.find((f) => f.id === id) : null;
  const [view, setView] = useState<"cards" | "graph">("cards");
  const [editing, setEditing] = useState<Character | null | "new">(null);
  const [relEditing, setRelEditing] = useState<Relationship | null | "new">(null);

  const nameOf = (id: string) => characters.find((c) => c.id === id)?.name || "?";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">인물 · 관계도</h1>
          <p className="mt-1 text-sm text-ink-muted">
            인물 {characters.length}명 · 관계 {relationships.length}개
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-line bg-paper p-0.5">
            {(["cards", "graph"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  view === v ? "bg-brand-50 text-brand-700" : "text-ink-muted"
                }`}
              >
                {v === "cards" ? "카드" : "관계도"}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setEditing("new")}>
            <IconPlus width={16} height={16} /> 인물
          </button>
        </div>
      </header>

      {view === "cards" ? (
        characters.length === 0 ? (
          <EmptyState onAdd={() => setEditing("new")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((c) => (
              <button
                key={c.id}
                onClick={() => setEditing(c)}
                className="card group p-5 text-left transition hover:-translate-y-0.5 hover:shadow-pop"
                style={{ borderTopColor: c.color || "#7c54f5", borderTopWidth: 3 }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="relative flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                    style={{ background: (c.color || "#7c54f5") + "1f" }}
                  >
                    {c.emoji || "🧑"}
                    {c.rank != null && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                        {c.rank}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-ink">{c.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
                      {c.role && <span>{c.role}</span>}
                      {factionName(c.factionId) && (
                        <span className="text-ink-faint">
                          · {factionName(c.factionId)!.emoji} {factionName(c.factionId)!.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {c.aliases && (
                  <p className="mt-2 text-xs text-ink-faint">a.k.a. {c.aliases}</p>
                )}
                {c.summary && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{c.summary}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-ink-faint">
                  {c.lifeStatus && c.lifeStatus !== "alive" && (
                    <span className={`chip ${LIFE_META[c.lifeStatus]?.cls || "bg-paper-sunk"}`}>
                      {LIFE_META[c.lifeStatus]?.label || c.lifeStatus}
                    </span>
                  )}
                  {c.element && <span className="chip bg-brand-50 text-brand-700">{c.element}</span>}
                  {c.tier && <span className="chip bg-paper-sunk">{c.tier}</span>}
                  {c.mbti && <span className="chip bg-paper-sunk">{c.mbti}</span>}
                  {c.tags &&
                    c.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3).map((t) => (
                      <span key={t} className="chip bg-paper-sunk">#{t}</span>
                    ))}
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <RelationshipGraph
            characters={characters}
            relationships={relationships}
            onEditRelationship={(r) => setRelEditing(r)}
          />
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">관계 목록</h2>
              <button
                className="btn-outline"
                onClick={() => setRelEditing("new")}
                disabled={characters.length < 2}
              >
                <IconPlus width={16} height={16} /> 관계 추가
              </button>
            </div>
            {relationships.length === 0 ? (
              <p className="text-sm text-ink-faint">
                {characters.length < 2
                  ? "인물이 2명 이상이어야 관계를 만들 수 있어요."
                  : "아직 관계가 없어요."}
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {relationships.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-2 py-2.5 text-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: KIND_META[r.kind || "neutral"]?.color }}
                    />
                    <span className="font-medium text-ink">{nameOf(r.fromId)}</span>
                    <span className="text-ink-faint">→</span>
                    <span className="font-medium text-ink">{nameOf(r.toId)}</span>
                    {r.label && (
                      <span className="chip bg-paper-sunk text-ink-muted">{r.label}</span>
                    )}
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
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 인물 모달 */}
      {editing !== null && (
        <CharacterModal
          projectId={projectId}
          character={editing === "new" ? null : editing}
          factions={factions}
          onClose={() => setEditing(null)}
        />
      )}

      {/* 관계 모달 */}
      {relEditing !== null && (
        <RelationshipModal
          projectId={projectId}
          characters={characters}
          relationship={relEditing === "new" ? null : relEditing}
          onClose={() => setRelEditing(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <IconUsers width={36} height={36} className="text-brand-300" />
      <h2 className="text-lg font-semibold text-ink">첫 인물을 만들어보세요</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        주인공, 조력자, 악역… 인물을 카드로 정리하고 관계도로 연결하세요.
      </p>
      <button className="btn-primary mt-1" onClick={onAdd}>
        <IconPlus width={16} height={16} /> 인물 추가
      </button>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  textarea,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue || ""}
          placeholder={placeholder}
          rows={3}
          className="input resize-y"
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue || ""}
          placeholder={placeholder}
          className="input"
        />
      )}
    </div>
  );
}

function CharacterModal({
  projectId,
  character,
  factions,
  onClose,
}: {
  projectId: string;
  character: Character | null;
  factions: FactionLite[];
  onClose: () => void;
}) {
  const [emoji, setEmoji] = useState(character?.emoji || "🧑");
  const [color, setColor] = useState(character?.color || "#7c54f5");
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <Modal
      open
      onClose={onClose}
      title={character ? "인물 편집" : "새 인물"}
      width="max-w-2xl"
    >
      <form
        action={async (fd) => {
          await saveCharacter(projectId, fd);
          onClose();
        }}
        className="space-y-4"
      >
        {character && <input type="hidden" name="id" value={character.id} />}
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
          <Field label="이름 *" name="name" defaultValue={character?.name} placeholder="이름" />
          <Field label="이명 / 가명" name="aliases" defaultValue={character?.aliases} placeholder="예: 케이가스, 란" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="역할" name="role" defaultValue={character?.role} placeholder="주인공 / 조력자 / 악역" />
          <div>
            <label className="label">소속 세력</label>
            <select name="factionId" defaultValue={character?.factionId || ""} className="input">
              <option value="">소속 없음</option>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.emoji} {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Field
          label="한 줄 요약"
          name="summary"
          defaultValue={character?.summary}
          placeholder="이 인물을 한 줄로 설명하면?"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="속성 / 능력 계열" name="element" defaultValue={character?.element} placeholder="예: 검류 / 전기" />
          <Field label="랭킹 (숫자)" name="rank" defaultValue={character?.rank != null ? String(character.rank) : ""} placeholder="예: 7" />
          <Field label="등급" name="tier" defaultValue={character?.tier} placeholder="예: 중급 월성" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">생존 상태</label>
            <select name="lifeStatus" defaultValue={character?.lifeStatus || "alive"} className="input">
              <option value="alive">생존</option>
              <option value="dead">사망</option>
              <option value="revived">환생/부활</option>
              <option value="unknown">불명</option>
            </select>
          </div>
          <Field label="MBTI" name="mbti" defaultValue={character?.mbti} placeholder="예: ENFJ" />
          <Field label="목표/동기" name="goal" defaultValue={character?.goal} placeholder="🎯" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="나이" name="age" defaultValue={character?.age} />
          <Field label="성별" name="gender" defaultValue={character?.gender} />
        </div>
        <Field label="태그 (쉼표로 구분)" name="tags" defaultValue={character?.tags} placeholder="예: 천재, 복수자, 떡밥보유" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="외모" name="appearance" defaultValue={character?.appearance} textarea />
          <Field label="성격" name="personality" defaultValue={character?.personality} textarea />
        </div>
        <Field label="배경/과거" name="background" defaultValue={character?.background} textarea />
        <Field label="메모" name="notes" defaultValue={character?.notes} textarea />

        <div className="flex items-center justify-between gap-2 pt-1">
          {character ? (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              className="btn text-red-500 hover:bg-red-50"
            >
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

      {character && (
        <Modal
          open={confirmDel}
          onClose={() => setConfirmDel(false)}
          title="인물 삭제"
          width="max-w-sm"
        >
          <p className="text-sm text-ink-soft">
            <b>{character.name}</b> 인물과 연결된 관계가 모두 삭제됩니다.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmDel(false)}>
              취소
            </button>
            <form
              action={async () => {
                await deleteCharacter(projectId, character.id);
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

function RelationshipModal({
  projectId,
  characters,
  relationship,
  onClose,
}: {
  projectId: string;
  characters: Character[];
  relationship: Relationship | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={relationship ? "관계 편집" : "새 관계"}
      width="max-w-md"
    >
      <form
        action={async (fd) => {
          await saveRelationship(projectId, fd);
          onClose();
        }}
        className="space-y-4"
      >
        {relationship && <input type="hidden" name="id" value={relationship.id} />}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">대상 A (주체)</label>
            <select name="fromId" defaultValue={relationship?.fromId} className="input" required>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">대상 B</label>
            <select name="toId" defaultValue={relationship?.toId} className="input" required>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">관계명</label>
            <input
              name="label"
              defaultValue={relationship?.label || ""}
              className="input"
              placeholder="연인 / 라이벌 / 스승"
            />
          </div>
          <div>
            <label className="label">유형</label>
            <select name="kind" defaultValue={relationship?.kind || "neutral"} className="input">
              {Object.entries(KIND_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Field
          label="설명"
          name="description"
          defaultValue={relationship?.description}
          textarea
          placeholder="이 관계에 대한 메모"
        />
        <div className="flex items-center justify-between gap-2 pt-1">
          {relationship ? (
            <form
              action={async () => {
                await deleteRelationship(projectId, relationship.id);
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
