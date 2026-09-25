"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/data";

const schema = z.object({
  author_name: z.string().trim().min(1, "Name required").max(120),
  role: z.string().trim().max(120).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  body: z.string().trim().min(1, "Testimonial text required").max(2000),
  avatar_url: z.string().trim().max(400).optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("published"),
  position: z.coerce.number().int().min(0).default(0),
});

type Result = { ok: true } | { ok: false; error: string };
const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);
const toRow = (t: z.infer<typeof schema>) => ({
  author_name: t.author_name, role: blank(t.role), rating: t.rating,
  body: t.body, avatar_url: blank(t.avatar_url), status: t.status, position: t.position,
});
const done = () => { revalidatePath("/admin"); revalidatePath("/"); };

export async function createTestimonial(raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { error } = await admin.from("testimonials").insert(toRow(parsed.data));
  if (error) { console.error("[createTestimonial]", error.message); return { ok: false, error: "Could not create." }; }
  done();
  return { ok: true };
}

export async function updateTestimonial(id: string, raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { error } = await admin.from("testimonials").update(toRow(parsed.data)).eq("id", id);
  if (error) { console.error("[updateTestimonial]", error.message); return { ok: false, error: "Could not save." }; }
  done();
  return { ok: true };
}

// Hard delete — testimonials has no deleted_at column.
export async function deleteTestimonial(id: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("testimonials").delete().eq("id", id);
  if (error) { console.error("[deleteTestimonial]", error.message); return { ok: false, error: "Could not delete." }; }
  done();
  return { ok: true };
}
