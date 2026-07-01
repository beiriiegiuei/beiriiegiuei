import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { IconPlus, IconHome, IconBook } from "@/components/icons";
import { WorkCard, type WorkCardData } from "./StoriesClient";

export const dynamic = "force-dynamic";

type StoryRow = {
  id: string;
  title: string;
  description: string | null;
  coverEmoji: string | null;
  genre: string | null;
  authorId: string;
  author: { displayName: string };
  episodes: {
    published: boolean;
    _count: { reads: number; likes: number };
  }[];
};

function toCard(s: StoryRow): WorkCardData {
  const pub = s.episodes.filter((e) => e.published);
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    coverEmoji: s.coverEmoji,
    genre: s.genre,
    episodeCount: pub.length,
    totalEpisodes: s.episodes.length,
    reads: pub.reduce((n, e) => n + e._count.reads, 0),
    likes: pub.reduce((n, e) => n + e._count.likes, 0),
    author: s.author.displayName,
  };
}

export default async function StoriesPage() {
  const user = await requireUser("/stories");

  const include = {
    author: { select: { displayName: true } },
    episodes: {
      select: { published: true, _count: { select: { reads: true, likes: true } } },
    },
  } as const;

  const [all, mine] = await Promise.all([
    db.talkStory.findMany({ orderBy: { updatedAt: "desc" }, include }),
    db.talkStory.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
      include,
    }),
  ]);

  // '모두의 이야기' = 공개된 화가 하나라도 있는 작품
  const publicWorks = (all as StoryRow[])
    .filter((s) => s.episodes.some((e) => e.published))
    .map(toCard);
  const myWorks = (mine as StoryRow[]).map(toCard);

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
            작품을 만들고 화(1화·2화…)를 이어 써보세요.
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
            <IconPlus width={16} height={16} /> 새 작품
          </Link>
        </div>
      </header>

      {myWorks.length > 0 && (
        <section className="mb-10" aria-labelledby="mine-heading">
          <h2 id="mine-heading" className="mb-3 text-sm font-semibold text-ink-muted">
            내 작품
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myWorks.map((w) => (
              <WorkCard key={w.id} work={w} owner />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="all-heading">
        <h2 id="all-heading" className="mb-3 text-sm font-semibold text-ink-muted">
          모두의 이야기
        </h2>
        {publicWorks.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="text-5xl">💬</div>
            <h3 className="text-lg font-semibold text-ink">
              아직 공개된 이야기가 없어요
            </h3>
            <p className="max-w-sm text-sm text-ink-muted">
              작품을 만들고 첫 화를 개시하면 여기에 올라와요.
            </p>
            <Link href="/stories/new" className="btn-primary mt-2">
              <IconPlus width={16} height={16} /> 새 작품 만들기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicWorks.map((w) => (
              <WorkCard key={w.id} work={w} owner={false} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
