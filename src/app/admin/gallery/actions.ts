"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/data";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fields = {
  title: z.string().trim().min(1, "Title required").max(160),
  subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  hero: z.string().trim().min(1, "Hero image required"),
  hero_alt: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
};
const createSchema = z.object({ slug: z.string().trim().toLowerCase().regex(slugRe, "Slug must be kebab-case"), ...fields });
const updateSchema = z.object(fields);

type Result = { ok: true; slug: string } | { ok: false; error: string };
const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);
const toRow = (t: z.infer<typeof updateSchema>) => ({
  title: t.title, subtitle: blank(t.subtitle), hero: t.hero, hero_alt: blank(t.hero_alt), status: t.status,
});
function revalidateGallery(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/gallery");
  revalidatePath(`/gallery/${slug}`);
}

export async function createGalleryAlbum(raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const t = parsed.data;
  const { data: existing } = await admin.from("gallery_albums").select("id").eq("slug", t.slug).maybeSingle();
  if (existing) return { ok: false, error: `Slug "${t.slug}" is already taken.` };
  const { error } = await admin.from("gallery_albums").insert({ slug: t.slug, ...toRow(t) });
  if (error) { console.error("[createGalleryAlbum]", error.message); return { ok: false, error: "Could not create the album." }; }
  revalidateGallery(t.slug);
  return { ok: true, slug: t.slug };
}

export async function updateGalleryAlbum(slug: string, raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { error } = await admin.from("gallery_albums").update(toRow(parsed.data)).eq("slug", slug);
  if (error) { console.error("[updateGalleryAlbum]", error.message); return { ok: false, error: "Could not save the album." }; }
  revalidateGallery(slug);
  return { ok: true, slug };
}

export async function deleteGalleryAlbum(slug: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("gallery_albums").update({ deleted_at: new Date().toISOString() }).eq("slug", slug);
  if (error) { console.error("[deleteGalleryAlbum]", error.message); return { ok: false, error: "Could not delete the album." }; }
  revalidateGallery(slug);
  return { ok: true, slug };
}
