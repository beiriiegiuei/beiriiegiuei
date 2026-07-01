import { requireUser } from "@/lib/auth";
import { Editor } from "../Editor";

export const dynamic = "force-dynamic";

export default async function NewStoryPage() {
  await requireUser("/stories/new");
  return <Editor />;
}
