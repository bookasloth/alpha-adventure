import { requireAdmin } from "@/app/admin/data";
import TestimonialForm from "../TestimonialForm";

export const metadata = { title: "Add testimonial", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewTestimonialPage() {
  await requireAdmin();
  return <div className="min-h-screen bg-page text-ink"><TestimonialForm mode="new" /></div>;
}
