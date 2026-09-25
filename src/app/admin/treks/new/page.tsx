import { requireAdmin } from "@/app/admin/data";
import NewTrekForm from "./NewTrekForm";

export const metadata = { title: "Add trek", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewTrekPage() {
  await requireAdmin(); // redirects if not admin/staff
  return (
    <div className="min-h-screen bg-page text-ink">
      <NewTrekForm />
    </div>
  );
}
