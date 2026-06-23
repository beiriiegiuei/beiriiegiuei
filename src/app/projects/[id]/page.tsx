import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUniqueOrThrow({
    where: { id },
    include: {
      _count: {
        select: {
          characters: true,
          foreshadows: true,
          scenes: true,
          wikiPages: true,
          relationships: true,
          factions: true,
        },
      },
      foreshadows: true,
      characters: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  const planted = project.foreshadows.filter((f) => f.status === "planted").length;
  const resolved = project.foreshadows.filter((f) => f.status === "resolved").length;
  const resolveRate =
    project.foreshadows.length > 0
      ? Math.round((resolved / project.foreshadows.length) * 100)
      : 0;

  const stats = [
    { label: "등장인물", value: project._count.characters, emoji: "👤", href: "characters" },
    { label: "세력", value: project._count.factions, emoji: "🛡️", href: "factions" },
    { label: "떡밥", value: project._count.foreshadows, emoji: "🎣", href: "foreshadowing" },
    { label: "회차", value: project._count.scenes, emoji: "🎬", href: "board" },
    { label: "위키", value: project._count.wikiPages, emoji: "📚", href: "wiki" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <header className="mb-8">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{project.coverEmoji || "📖"}</span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{project.title}</h1>
            {project.genre && (
              <span className="chip mt-2 bg-brand-50 text-brand-700">{project.genre}</span>
            )}
            <p className="mt-2 text-ink-muted">
              {project.logline || "로그라인을 추가해 작품의 핵심을 한 줄로 잡아보세요."}
            </p>
          </div>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={`/projects/${id}/${s.href}`}
            className="card flex flex-col items-center justify-center gap-1 px-3 py-5 transition hover:border-brand-200 hover:shadow-pop"
          >
            <span className="text-xl">{s.emoji}</span>
            <span className="text-2xl font-bold text-ink">{s.value}</span>
            <span className="text-xs text-ink-muted">{s.label}</span>
          </Link>
        ))}
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* 떡밥 회수 현황 */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">🎣 떡밥 회수 현황</h2>
          {project.foreshadows.length === 0 ? (
            <p className="text-sm text-ink-faint">아직 심어둔 떡밥이 없어요.</p>
          ) : (
            <>
              <div className="mb-2 flex items-end justify-between">
                <span className="text-3xl font-bold text-brand-600">{resolveRate}%</span>
                <span className="text-xs text-ink-muted">
                  회수 {resolved} · 미회수 {planted}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-sunk">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${resolveRate}%` }}
                />
              </div>
            </>
          )}
          <Link
            href={`/projects/${id}/foreshadowing`}
            className="mt-4 inline-block text-xs font-medium text-brand-600 hover:underline"
          >
            떡밥 관리하기 →
          </Link>
        </div>

        {/* 최근 인물 */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">👤 최근 추가한 인물</h2>
          {project.characters.length === 0 ? (
            <p className="text-sm text-ink-faint">아직 인물이 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {project.characters.map((c) => (
                <li key={c.id} className="flex items-center gap-2.5 text-sm">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
                    style={{ background: (c.color || "#7c54f5") + "22" }}
                  >
                    {c.emoji || "🧑"}
                  </span>
                  <span className="font-medium text-ink">{c.name}</span>
                  {c.role && <span className="text-xs text-ink-faint">{c.role}</span>}
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/projects/${id}/characters`}
            className="mt-4 inline-block text-xs font-medium text-brand-600 hover:underline"
          >
            인물 관리하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
