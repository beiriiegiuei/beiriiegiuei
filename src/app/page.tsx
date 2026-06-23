import { db } from "@/lib/db";
import { IconSpark } from "@/components/icons";
import { NewProjectButton, ProjectCard } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { characters: true, foreshadows: true, scenes: true, wikiPages: true },
      },
    },
  });

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 sm:py-16">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <IconSpark width={14} height={14} /> 작품 구상 워크스페이스
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            플롯윅스
          </h1>
          <p className="mt-2 max-w-md text-ink-muted">
            세계관 · 인물 · 떡밥 · 콘티를 흩어지지 않게 한 곳에서.
            <br className="hidden sm:block" />
            구상의 노가다를 줄이고 이야기에 집중하세요.
          </p>
        </div>
        <NewProjectButton />
      </header>

      {projects.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
          <div className="text-5xl">🪄</div>
          <h2 className="text-lg font-semibold text-ink">첫 작품을 만들어볼까요?</h2>
          <p className="max-w-sm text-sm text-ink-muted">
            제목만 정하면 인물·떡밥·콘티·세계관 위키가 한 번에 준비됩니다.
          </p>
          <div className="mt-2">
            <NewProjectButton />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <footer className="mt-16 text-center text-xs text-ink-faint">
        클라우드 DB에 안전하게 저장됩니다.
      </footer>
    </main>
  );
}
