import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { IconSpark } from "@/components/icons";
import { AuthForm } from "./AuthForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const { next, mode } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next || "/stories");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
        >
          <IconSpark width={14} height={14} /> 플롯윅스 톡스토리
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          대화로 읽고 쓰는 이야기
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          로그인하면 작품을 읽고, 직접 쓸 수도 있어요.
        </p>
      </div>

      <div className="card p-6">
        <AuthForm initialMode={mode === "signup" ? "signup" : "login"} next={next} />
      </div>

      <p className="mt-6 text-center text-xs text-ink-faint">
        읽기와 쓰기 모두 로그인이 필요해요.
      </p>
    </main>
  );
}
