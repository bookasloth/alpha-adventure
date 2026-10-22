import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/admin/data";
import TrekEditForm from "../../TrekEditForm";

export const metadata = { title: "Edit trek", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditTrekPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { admin } = await requireAdmin();
  const { data: t } = await admin
    .from("treks")
    .select("id,slug,title,summary,overview,hero_image,base_price,difficulty,status,group,tags,badge,region,location,state,duration_days,altitude,base_camp,best_season,group_size,featured,brochure_url,suitable_age,accommodation,fitness_criteria,not_to_miss")
    .eq("slug", params.slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!t) notFound();

  const [inc, exc, pkgs, iti, faq, gal] = await Promise.all([
    admin.from("inclusions").select("text").eq("trek_id", t.id).order("sort"),
    admin.from("exclusions").select("text").eq("trek_id", t.id).order("sort"),
    admin.from("pricing_packages").select("name,price,inclusions,cta_label").eq("trek_id", t.id).order("sort"),
    admin.from("itinerary_days").select("title,description,image,trek_distance,trek_duration,drive_distance,drive_duration,altitude_gain,altitude_loss,meals").eq("trek_id", t.id).order("day_no"),
    admin.from("trek_faqs").select("question,answer").eq("trek_id", t.id).order("sort"),
    admin.from("trek_gallery").select("image_url,caption").eq("trek_id", t.id).order("sort_order"),
  ]);

  const initial = {
    slug: t.slug,
    title: t.title ?? "",
    summary: t.summary ?? "",
    overview: t.overview ?? "",
    hero_image: t.hero_image ?? "",
    price: String(Math.round((t.base_price ?? 0) / 100)),
    difficulty: t.difficulty ?? "moderate",
    status: t.status ?? "draft",
    group: t.group ?? "sahyadri",
    tags: (t.tags ?? []).join(", "),
    badge: t.badge ?? "",
    region: t.region ?? "",
    location: t.location ?? "",
    state: t.state ?? "",
    duration_days: t.duration_days != null ? String(t.duration_days) : "",
    altitude: t.altitude ?? "",
    base_camp: t.base_camp ?? "",
    best_season: t.best_season ?? "",
    group_size: t.group_size ?? "",
    featured: !!t.featured,
    brochure_url: t.brochure_url ?? "",
    suitable_age: t.suitable_age ?? "",
    accommodation: t.accommodation ?? "",
    fitness_criteria: t.fitness_criteria ?? "",
    not_to_miss: t.not_to_miss ?? [],
    inclusions: (inc.data ?? []).map((r) => r.text),
    exclusions: (exc.data ?? []).map((r) => r.text),
    packages: (pkgs.data ?? []).map((p) => ({
      name: p.name ?? "",
      price: String(Math.round((p.price ?? 0) / 100)),
      inclusions: (p.inclusions ?? []).join("\n"),
      cta_label: p.cta_label ?? "Book Now",
    })),
    itinerary: (iti.data ?? []).map((d) => ({
      title: d.title ?? "",
      description: d.description ?? "",
      image: d.image ?? "",
      trek_distance: d.trek_distance ?? "",
      trek_duration: d.trek_duration ?? "",
      drive_distance: d.drive_distance ?? "",
      drive_duration: d.drive_duration ?? "",
      altitude_gain: d.altitude_gain ?? "",
      altitude_loss: d.altitude_loss ?? "",
      meals: d.meals ?? "",
    })),
    faqs: (faq.data ?? []).map((q) => ({ question: q.question ?? "", answer: q.answer ?? "" })),
    gallery: (gal.data ?? []).map((g) => ({ image_url: g.image_url ?? "", caption: g.caption ?? "" })),
  };
  return (
    <div className="min-h-screen bg-page text-ink">
      <TrekEditForm initial={initial} />
    </div>
  );
}
