import { requireUser } from "@/lib/auth";
import { NewWorkForm } from "../NewWorkForm";

export const dynamic = "force-dynamic";

export default async function NewStoryPage() {
  await requireUser("/stories/new");
  return <NewWorkForm />;
}
