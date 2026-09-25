"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/data";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const tourSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(160),
  slug: z.string().trim().toLowerCase().regex(slugRe, "Slug must be kebab-case (a-z, 0-9, hyphens)"),
  type: z.enum(["Domestic", "International"]),
  duration: z.string().trim().max(40).optional().or(z.literal("")),
  base_price: z.coerce.number().min(0).max(10_000_000), // ₹
  image: z.string().trim().min(1, "Image required"),
  description: z.string().trim().min(1, "Description required"),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type CreateTourInput = z.input<typeof tourSchema>;
type Result = { ok: true; slug: string } | { ok: false; error: string };

const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export async function createTour(raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();

  const parsed = tourSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const t = parsed.data;

  const { data: existing } = await admin.from("tours").select("id").eq("slug", t.slug).maybeSingle();
  if (existing) return { ok: false, error: `Slug "${t.slug}" is already taken.` };

  const { error } = await admin.from("tours").insert({
    title: t.title,
    slug: t.slug,
    type: t.type,
    duration: blank(t.duration),
    base_price: Math.round(t.base_price * 100),
    image: t.image,
    description: t.description,
    featured: t.featured,
    status: t.status,
  });
  if (error) {
    console.error("[createTour] insert failed:", error.message);
    return { ok: false, error: "Could not create the tour. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/tour-packages");
  revalidatePath(`/tour-packages/${t.slug}`);
  revalidatePath("/");
  return { ok: true, slug: t.slug };
}
