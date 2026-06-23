"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconArrowLeft,
  IconBoard,
  IconBook,
  IconHook,
  IconUsers,
  IconWiki,
} from "@/components/icons";

export function Sidebar({
  projectId,
  title,
  emoji,
}: {
  projectId: string;
  title: string;
  emoji: string;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  const items = [
    { href: base, label: "개요", icon: IconBook, exact: true },
    { href: `${base}/characters`, label: "인물 · 관계도", icon: IconUsers },
    { href: `${base}/foreshadowing`, label: "떡밥 추적기", icon: IconHook },
    { href: `${base}/board`, label: "콘티 보드", icon: IconBoard },
    { href: `${base}/wiki`, label: "세계관 위키", icon: IconWiki },
  ];

  return (
    <aside className="flex shrink-0 flex-col border-line bg-paper md:h-screen md:w-64 md:border-r">
      <div className="border-b border-line px-4 py-4">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <IconArrowLeft width={14} height={14} /> 모든 작품
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{emoji}</span>
          <h1 className="line-clamp-2 text-sm font-bold leading-tight text-ink">
            {title}
          </h1>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:gap-0.5 md:overflow-visible">
        {items.map((it) => {
          const active = it.exact
            ? pathname === it.href
            : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-soft hover:bg-paper-sunk"
              }`}
            >
              <Icon width={18} height={18} />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
