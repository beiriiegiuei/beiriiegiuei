import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { IconPlus, IconHome, IconBook } from "@/components/icons";
import { StoryCard } from "./StoriesClient";

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const user = await requireUser("/stories");

  const [published, mine] = await Promise.all([
    db.talkStory.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { displayName: true } },
        _count: { select: { reads: true, likes: true } },
      },
    }),
    db.talkStory.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { displayName: true } },
        _count: { select: { reads: true, likes: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <IconBook width={14} height={14} /> 톡스토리
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            대화로 읽는 이야기
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            탭하거나 방향키·스페이스로 한 줄씩 넘겨 읽어요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="btn-ghost" aria-label="홈으로">
            <IconHome width={16} height={16} />
          </Link>
          <span className="hidden text-sm text-ink-muted sm:inline">
            {user.displayName}님
          </span>
          <form action={logout}>
            <button className="btn-ghost text-sm">로그아웃</button>
          </form>
          <Link href="/stories/new" className="btn-primary">
            <IconPlus width={16} height={16} /> 새 스토리
          </Link>
        </div>
      </header>

      {mine.length > 0 && (
        <section className="mb-10" aria-labelledby="mine-heading">
          <h2 id="mine-heading" className="mb-3 text-sm font-semibold text-ink-muted">
            내가 쓴 이야기
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((s) => (
              <StoryCard key={s.id} story={s} owner />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="all-heading">
        <h2 id="all-heading" className="mb-3 text-sm font-semibold text-ink-muted">
          모두의 이야기
        </h2>
        {published.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="text-5xl">💬</div>
            <h3 className="text-lg font-semibold text-ink">
              아직 공개된 이야기가 없어요
            </h3>
            <p className="max-w-sm text-sm text-ink-muted">
              첫 번째 대화형 이야기를 직접 써서 공개해보세요.
            </p>
            <Link href="/stories/new" className="btn-primary mt-2">
              <IconPlus width={16} height={16} /> 새 스토리 쓰기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {published.map((s) => (
              <StoryCard key={s.id} story={s} owner={s.authorId === user.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
