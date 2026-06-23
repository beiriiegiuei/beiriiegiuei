import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "./Sidebar";

export const dynamic = "force-dynamic";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        projectId={project.id}
        title={project.title}
        emoji={project.coverEmoji || "📖"}
      />
      <main className="min-w-0 flex-1 bg-paper-soft">{children}</main>
    </div>
  );
}
