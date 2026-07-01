"use client";

import Link from "next/link";

export type WorkCardData = {
  id: string;
  title: string;
  description: string | null;
  coverEmoji: string | null;
  genre: string | null;
  episodeCount: number; // 공개된 화 수
  totalEpisodes: number; // 전체 화 수 (본인용)
  reads: number;
  likes: number;
  author: string;
};

export function WorkCard({
  work,
  owner,
}: {
  work: WorkCardData;
  owner: boolean;
}) {
  return (
    <Link
      href={`/stories/${work.id}`}
      className="card block h-full p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-3xl">{work.coverEmoji || "💬"}</span>
        {owner && work.totalEpisodes > work.episodeCount && (
          <span className="chip bg-paper-sunk text-ink-muted">
            비공개 {work.totalEpisodes - work.episodeCount}화
          </span>
        )}
      </div>
      <h3 className="line-clamp-1 text-lg font-semibold text-ink">{work.title}</h3>
      {work.genre && (
        <span className="chip mt-1 bg-brand-50 text-brand-700">{work.genre}</span>
      )}
      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-ink-muted">
        {work.description || "소개글이 아직 없어요."}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-faint">
        <span>✍️ {work.author}</span>
        <span className="flex gap-3">
          <span>📖 {work.episodeCount}화</span>
          <span>👀 {work.reads}</span>
          <span>💜 {work.likes}</span>
        </span>
      </div>
    </Link>
  );
}
