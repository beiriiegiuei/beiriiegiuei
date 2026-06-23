"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { IconPlus, IconTrash } from "@/components/icons";
import { createProject, deleteProject } from "./actions";

const EMOJIS = ["📖", "⚔️", "🪐", "🏰", "🌃", "🩸", "💞", "🕵️", "🐉", "🌸", "🎭", "🔮"];

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [emoji, setEmoji] = useState("📖");

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <IconPlus width={16} height={16} /> 새 작품
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="새 작품 만들기">
        <form action={createProject} className="space-y-4">
          <div>
            <span className="label">표지 이모지</span>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
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
              placeholder="예: 끝나지 않는 겨울"
            />
          </div>
          <div>
            <label className="label" htmlFor="logline">
              한 줄 소개 (로그라인)
            </label>
            <input
              id="logline"
              name="logline"
              className="input"
              placeholder="예: 시간이 멈춘 도시에서 유일하게 깨어있는 소녀의 이야기"
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
              placeholder="예: 판타지 / 로맨스 / 미스터리"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              취소
            </button>
            <button type="submit" className="btn-primary">
              만들기
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

type ProjectWithCount = {
  id: string;
  title: string;
  logline: string | null;
  genre: string | null;
  coverEmoji: string | null;
  _count: {
    characters: number;
    foreshadows: number;
    scenes: number;
    wikiPages: number;
  };
};

export function ProjectCard({ project }: { project: ProjectWithCount }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="group relative">
      <Link
        href={`/projects/${project.id}`}
        className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop"
      >
        <div className="mb-3 text-3xl">{project.coverEmoji || "📖"}</div>
        <h3 className="line-clamp-1 text-lg font-semibold text-ink">{project.title}</h3>
        {project.genre && (
          <span className="chip mt-1 bg-brand-50 text-brand-700">{project.genre}</span>
        )}
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-ink-muted">
          {project.logline || "아직 로그라인이 없어요."}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
          <span>👤 인물 {project._count.characters}</span>
          <span>🎣 떡밥 {project._count.foreshadows}</span>
          <span>🎬 장면 {project._count.scenes}</span>
          <span>📚 위키 {project._count.wikiPages}</span>
        </div>
      </Link>
      <button
        onClick={() => setConfirming(true)}
        className="absolute right-3 top-3 rounded-lg bg-paper/80 p-1.5 text-ink-faint opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        aria-label="삭제"
      >
        <IconTrash width={16} height={16} />
      </button>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="작품 삭제"
        width="max-w-sm"
      >
        <p className="text-sm text-ink-soft">
          <b>{project.title}</b> 작품과 모든 인물·떡밥·콘티·위키가 영구히 삭제됩니다.
          되돌릴 수 없어요.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirming(false)}>
            취소
          </button>
          <form action={deleteProject.bind(null, project.id)}>
            <button className="btn bg-red-500 text-white hover:bg-red-600">삭제</button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
