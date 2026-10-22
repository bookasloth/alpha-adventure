"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/data";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Shared editable fields. trek_id optionally links a post to a trek (shown as a
// "story" on that trek's detail page). Media/author columns are managed
// elsewhere and left untouched here.
const fields = {
  title: z.string().trim().min(1, "Title required").max(200),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  body: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
  trek_id: z.string().uuid().optional().or(z.literal("")),
  seo_title: z.string().trim().max(200).optional().or(z.literal("")),
  meta_description: z.string().trim().max(300).optional().or(z.literal("")),
};
const createSchema = z.object({ slug: z.string().trim().toLowerCase().regex(slugRe, "Slug must be kebab-case (a-z, 0-9, hyphens)"), ...fields });
const updateSchema = z.object(fields);

type Result = { ok: true; slug: string } | { ok: false; error: string };
const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

const toRow = (t: z.infer<typeof updateSchema>) => ({
  title: t.title,
  excerpt: blank(t.excerpt),
  body: blank(t.body),
  status: t.status,
  trek_id: blank(t.trek_id),
  seo_title: blank(t.seo_title),
  meta_description: blank(t.meta_description),
});

function revalidatePost(slug: string) {
  revalidatePath("/admin");
  revalidatePath(`/blog/${slug}`);
}

export async function createPost(raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const t = parsed.data;

  const { data: existing } = await admin.from("posts").select("id").eq("slug", t.slug).maybeSingle();
  if (existing) return { ok: false, error: `Slug "${t.slug}" is already taken.` };

  const { error } = await admin.from("posts").insert({
    slug: t.slug,
    ...toRow(t),
    // Stamp the publish date when it goes live; drafts stay unpublished.
    published_at: t.status === "published" ? new Date().toISOString() : null,
  });
  if (error) { console.error("[createPost]", error.message); return { ok: false, error: "Could not create the post." }; }
  revalidatePost(t.slug);
  return { ok: true, slug: t.slug };
}

export async function updatePost(slug: string, raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const t = parsed.data;

  // Preserve the original publish date: stamp it the first time it goes live,
  // keep it on later edits, and clear it only when returned to draft.
  const { data: current } = await admin.from("posts").select("published_at").eq("slug", slug).maybeSingle();
  const published_at =
    t.status === "published" ? (current?.published_at ?? new Date().toISOString()) : null;

  const { error } = await admin.from("posts").update({ ...toRow(t), published_at }).eq("slug", slug);
  if (error) { console.error("[updatePost]", error.message); return { ok: false, error: "Could not save the post." }; }
  revalidatePost(slug);
  return { ok: true, slug };
}

// Soft delete — keeps the row (and any trek links) but hides it everywhere.
export async function deletePost(slug: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("posts").update({ deleted_at: new Date().toISOString() }).eq("slug", slug);
  if (error) { console.error("[deletePost]", error.message); return { ok: false, error: "Could not delete the post." }; }
  revalidatePost(slug);
  return { ok: true, slug };
}
