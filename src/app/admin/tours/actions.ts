"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/data";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const fields = {
  title: z.string().trim().min(1, "Title required").max(160),
  type: z.enum(["Domestic", "International"]),
  duration: z.string().trim().max(40).optional().or(z.literal("")),
  base_price: z.coerce.number().min(0).max(10_000_000), // ₹
  image: z.string().trim().min(1, "Image required"),
  description: z.string().trim().min(1, "Description required"),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
};
const createSchema = z.object({ slug: z.string().trim().toLowerCase().regex(slugRe, "Slug must be kebab-case (a-z, 0-9, hyphens)"), ...fields });
const updateSchema = z.object(fields);

type Result = { ok: true; slug: string } | { ok: false; error: string };
const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);
const toRow = (t: z.infer<typeof updateSchema>) => ({
  title: t.title, type: t.type, duration: blank(t.duration),
  base_price: Math.round(t.base_price * 100), image: t.image,
  description: t.description, featured: t.featured, status: t.status,
});

function revalidateTour(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/tour-packages");
  revalidatePath(`/tour-packages/${slug}`);
  revalidatePath("/");
}

export async function createTour(raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const t = parsed.data;

  const { data: existing } = await admin.from("tours").select("id").eq("slug", t.slug).maybeSingle();
  if (existing) return { ok: false, error: `Slug "${t.slug}" is already taken.` };

  const { error } = await admin.from("tours").insert({ slug: t.slug, ...toRow(t) });
  if (error) { console.error("[createTour]", error.message); return { ok: false, error: "Could not create the tour." }; }
  revalidateTour(t.slug);
  return { ok: true, slug: t.slug };
}

export async function updateTour(slug: string, raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { error } = await admin.from("tours").update(toRow(parsed.data)).eq("slug", slug);
  if (error) { console.error("[updateTour]", error.message); return { ok: false, error: "Could not save the tour." }; }
  revalidateTour(slug);
  return { ok: true, slug };
}

// Soft delete — keeps the row (and any references) but hides it everywhere.
export async function deleteTour(slug: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("tours").update({ deleted_at: new Date().toISOString() }).eq("slug", slug);
  if (error) { console.error("[deleteTour]", error.message); return { ok: false, error: "Could not delete the tour." }; }
  revalidateTour(slug);
  return { ok: true, slug };
}
