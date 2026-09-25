import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/admin/data";
import TestimonialForm from "../../TestimonialForm";

export const metadata = { title: "Edit testimonial", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({ params }: { params: { id: string } }) {
  const { admin } = await requireAdmin();
  const { data: t } = await admin
    .from("testimonials")
    .select("id,author_name,role,rating,body,avatar_url,status,position")
    .eq("id", params.id)
    .maybeSingle();
  if (!t) notFound();
  const initial = {
    id: t.id,
    author_name: t.author_name ?? "",
    role: t.role ?? "",
    rating: String(t.rating ?? 5),
    body: t.body ?? "",
    avatar_url: t.avatar_url ?? "",
    status: t.status ?? "published",
    position: String(t.position ?? 0),
  };
  return <div className="min-h-screen bg-page text-ink"><TestimonialForm mode="edit" initial={initial} /></div>;
}
