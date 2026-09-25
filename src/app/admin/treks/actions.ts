"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/data";

// Row-level edit only (basics / listing / facts / status). Child content
// (itinerary, inclusions, packages, dates) is managed via its own flows.
const rowSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(160),
  summary: z.string().trim().min(1, "Summary required").max(500),
  overview: z.string().trim().min(1, "Overview required"),
  hero_image: z.string().trim().min(1, "Hero image required"),
  base_price: z.coerce.number().min(0).max(10_000_000), // ₹
  difficulty: z.enum(["beginner", "moderate", "difficult"]),
  status: z.enum(["draft", "published"]),
  group: z.enum(["sahyadri", "himalayan", "central", "backpacking", "near-nagpur"]).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).default([]),
  badge: z.string().trim().max(60).optional().or(z.literal("")),
  region: z.string().trim().max(120).optional().or(z.literal("")),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  state: z.string().trim().max(120).optional().or(z.literal("")),
  duration_days: z.coerce.number().int().min(0).max(60).optional(),
  altitude: z.string().trim().max(120).optional().or(z.literal("")),
  base_camp: z.string().trim().max(160).optional().or(z.literal("")),
  best_season: z.string().trim().max(120).optional().or(z.literal("")),
  group_size: z.string().trim().max(120).optional().or(z.literal("")),
  featured: z.boolean().default(false),
  // Child content (reconciled = delete + reinsert on save).
  inclusions: z.array(z.string().trim().min(1)).default([]),
  exclusions: z.array(z.string().trim().min(1)).default([]),
  packages: z.array(z.object({
    name: z.string().trim().min(1),
    price: z.coerce.number().min(0).max(10_000_000),
    inclusions: z.array(z.string().trim().min(1)).default([]),
    cta_label: z.string().trim().min(1).default("Book Now"),
  })).default([]),
  itinerary: z.array(z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().optional().or(z.literal("")),
    image: z.string().trim().optional().or(z.literal("")),
  })).default([]),
});

type Result = { ok: true; slug: string } | { ok: false; error: string };
const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);
const toPaise = (r: number) => Math.round(r * 100);

function revalidateTrek(slug: string) {
  revalidatePath("/admin");
  revalidatePath(`/treks/${slug}`);
  revalidatePath("/treks/upcoming-treks");
  revalidatePath("/treks/trips-near-nagpur");
  revalidatePath("/treks/backpacking-trips");
  revalidatePath("/");
}

export async function updateTrek(slug: string, raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = rowSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const t = parsed.data;

  const { data: trek, error } = await admin.from("treks").update({
    title: t.title,
    summary: t.summary,
    overview: t.overview,
    hero_image: t.hero_image,
    base_price: toPaise(t.base_price),
    difficulty: t.difficulty,
    status: t.status,
    published_at: t.status === "published" ? new Date().toISOString() : null,
    group: blank(t.group),
    tags: t.tags,
    badge: blank(t.badge),
    duration_label: t.duration_days ? `${t.duration_days} Day${t.duration_days > 1 ? "s" : ""}` : null,
    region: blank(t.region),
    location: blank(t.location),
    state: blank(t.state),
    duration_days: t.duration_days ?? null,
    altitude: blank(t.altitude),
    base_camp: blank(t.base_camp),
    best_season: blank(t.best_season),
    group_size: blank(t.group_size),
    featured: t.featured,
  }).eq("slug", slug).select("id").single();

  if (error || !trek) { console.error("[updateTrek]", error?.message); return { ok: false, error: "Could not save the trek." }; }

  // Reconcile child content: clear then reinsert from the submitted arrays.
  const id = trek.id;
  await Promise.all([
    admin.from("inclusions").delete().eq("trek_id", id),
    admin.from("exclusions").delete().eq("trek_id", id),
    admin.from("pricing_packages").delete().eq("trek_id", id),
    admin.from("itinerary_days").delete().eq("trek_id", id),
  ]);
  const jobs = [];
  if (t.inclusions.length) jobs.push(admin.from("inclusions").insert(t.inclusions.map((text, sort) => ({ trek_id: id, text, sort }))));
  if (t.exclusions.length) jobs.push(admin.from("exclusions").insert(t.exclusions.map((text, sort) => ({ trek_id: id, text, sort }))));
  if (t.packages.length) jobs.push(admin.from("pricing_packages").insert(
    t.packages.map((p, sort) => ({ trek_id: id, name: p.name, price: toPaise(p.price), inclusions: p.inclusions, cta_label: p.cta_label, sort })),
  ));
  if (t.itinerary.length) jobs.push(admin.from("itinerary_days").insert(
    t.itinerary.map((d, i) => ({ trek_id: id, day_no: i + 1, title: d.title, description: blank(d.description), image: blank(d.image) })),
  ));
  const results = await Promise.all(jobs);
  for (const r of results) if (r.error) console.error("[updateTrek] child insert:", r.error.message);

  revalidateTrek(slug);
  return { ok: true, slug };
}

// Soft delete — removes it from every surface without dropping the row.
export async function deleteTrek(slug: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("treks").update({ deleted_at: new Date().toISOString() }).eq("slug", slug);
  if (error) { console.error("[deleteTrek]", error.message); return { ok: false, error: "Could not delete the trek." }; }
  revalidateTrek(slug);
  return { ok: true, slug };
}
