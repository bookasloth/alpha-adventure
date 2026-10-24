import { requireAdmin } from "@/app/admin/data";
import { listTeam } from "./actions";
import TeamClient from "./TeamClient";

export const metadata = { title: "Account managers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  await requireAdmin();
  const members = await listTeam();
  return <div className="min-h-screen bg-page text-ink"><TeamClient members={members} /></div>;
}
