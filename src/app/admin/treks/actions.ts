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
});

type Result = { ok: true; slug: string } | { ok: false; error: string };
const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

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

  const { error } = await admin.from("treks").update({
    title: t.title,
    summary: t.summary,
    overview: t.overview,
    hero_image: t.hero_image,
    base_price: Math.round(t.base_price * 100),
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
  }).eq("slug", slug);

  if (error) { console.error("[updateTrek]", error.message); return { ok: false, error: "Could not save the trek." }; }
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
