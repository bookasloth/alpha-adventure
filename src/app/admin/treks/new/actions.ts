"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/data";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const rupees = z.coerce.number().min(0).max(10_000_000); // ₹, converted to paise on save

const packageSchema = z.object({
  name: z.string().trim().min(1, "Package name required"),
  price: rupees,
  inclusions: z.array(z.string().trim().min(1)).default([]),
  cta_label: z.string().trim().min(1).default("Book Now"),
});

const trekSchema = z.object({
  // basics
  title: z.string().trim().min(1, "Title required").max(160),
  slug: z.string().trim().toLowerCase().regex(slugRe, "Slug must be kebab-case (a-z, 0-9, hyphens)"),
  summary: z.string().trim().min(1, "Summary required").max(500),
  overview: z.string().trim().min(1, "Overview required"),
  hero_image: z.string().trim().min(1, "Hero image required"),
  base_price: rupees,
  difficulty: z.enum(["easy", "moderate", "difficult"]),
  status: z.enum(["draft", "published"]).default("draft"),
  // facts (optional)
  region: z.string().trim().max(120).optional().or(z.literal("")),
  location: z.string().trim().max(160).optional().or(z.literal("")),
  state: z.string().trim().max(120).optional().or(z.literal("")),
  duration_days: z.coerce.number().int().min(0).max(60).optional(),
  altitude: z.string().trim().max(120).optional().or(z.literal("")),
  base_camp: z.string().trim().max(160).optional().or(z.literal("")),
  best_season: z.string().trim().max(120).optional().or(z.literal("")),
  group_size: z.string().trim().max(120).optional().or(z.literal("")),
  featured: z.boolean().default(false),
  // children
  inclusions: z.array(z.string().trim().min(1)).default([]),
  exclusions: z.array(z.string().trim().min(1)).default([]),
  packages: z.array(packageSchema).default([]),
});

export type CreateTrekInput = z.input<typeof trekSchema>;
type Result = { ok: true; slug: string } | { ok: false; error: string };

const toPaise = (r: number) => Math.round(r * 100);
const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export async function createTrek(raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin(); // redirects if not admin/staff

  const parsed = trekSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const t = parsed.data;

  // Slug must be unique.
  const { data: existing } = await admin.from("treks").select("id").eq("slug", t.slug).maybeSingle();
  if (existing) return { ok: false, error: `Slug "${t.slug}" is already taken.` };

  const { data: trek, error } = await admin
    .from("treks")
    .insert({
      title: t.title,
      slug: t.slug,
      summary: t.summary,
      overview: t.overview,
      hero_image: t.hero_image,
      base_price: toPaise(t.base_price),
      difficulty: t.difficulty,
      status: t.status,
      published_at: t.status === "published" ? new Date().toISOString() : null,
      region: blank(t.region),
      location: blank(t.location),
      state: blank(t.state),
      duration_days: t.duration_days ?? null,
      altitude: blank(t.altitude),
      base_camp: blank(t.base_camp),
      best_season: blank(t.best_season),
      group_size: blank(t.group_size),
      featured: t.featured,
    })
    .select("id,slug")
    .single();

  if (error || !trek) {
    console.error("[createTrek] insert failed:", error?.message);
    return { ok: false, error: "Could not create the trek. Please try again." };
  }

  // Children (best-effort inserts; a child failure shouldn't orphan the trek —
  // it's already created and editable, so we surface a soft warning via logs).
  const jobs = [];
  if (t.inclusions.length) {
    jobs.push(admin.from("inclusions").insert(t.inclusions.map((text, sort) => ({ trek_id: trek.id, text, sort }))));
  }
  if (t.exclusions.length) {
    jobs.push(admin.from("exclusions").insert(t.exclusions.map((text, sort) => ({ trek_id: trek.id, text, sort }))));
  }
  if (t.packages.length) {
    jobs.push(admin.from("pricing_packages").insert(
      t.packages.map((p, sort) => ({
        trek_id: trek.id,
        name: p.name,
        price: toPaise(p.price),
        inclusions: p.inclusions,
        cta_label: p.cta_label,
        sort,
      })),
    ));
  }
  const results = await Promise.all(jobs);
  for (const r of results) if (r.error) console.error("[createTrek] child insert failed:", r.error.message);

  revalidatePath("/admin");
  revalidatePath(`/treks/${trek.slug}`);
  return { ok: true, slug: trek.slug };
}
