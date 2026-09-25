import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/admin/data";
import TourForm from "../../TourForm";

export const metadata = { title: "Edit tour", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditTourPage({ params }: { params: { slug: string } }) {
  const { admin } = await requireAdmin();
  const { data: t } = await admin
    .from("tours")
    .select("slug,title,type,duration,base_price,image,description,featured,status")
    .eq("slug", params.slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!t) notFound();

  const initial = {
    slug: t.slug,
    title: t.title ?? "",
    type: t.type ?? "Domestic",
    duration: t.duration ?? "",
    price: String(Math.round((t.base_price ?? 0) / 100)),
    image: t.image ?? "",
    description: t.description ?? "",
    featured: !!t.featured,
    status: t.status ?? "draft",
  };
  return (
    <div className="min-h-screen bg-page text-ink">
      <TourForm mode="edit" initial={initial} />
    </div>
  );
}
