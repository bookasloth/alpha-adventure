import { requireAdmin } from "@/app/admin/data";
import NewTourForm from "./NewTourForm";

export const metadata = { title: "Add tour", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewTourPage() {
  await requireAdmin(); // redirects if not admin/staff
  return (
    <div className="min-h-screen bg-page text-ink">
      <NewTourForm />
    </div>
  );
}
