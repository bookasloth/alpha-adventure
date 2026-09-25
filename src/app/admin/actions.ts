"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "./data";

const optRupees = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).optional());

const departureSchema = z.object({
  trek_id: z.string().uuid("Pick a trek"),
  start_date: z.string().min(1, "Date required"),
  end_date: z.string().optional().or(z.literal("")),
  start_time: z.string().optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(1, "Capacity ≥ 1"),
  price_override: optRupees, // ₹, blank = base price
  status: z.enum(["scheduled", "open", "full", "closed", "cancelled", "completed"]).default("open"),
});

type Result = { ok: true; slug?: string } | { ok: false; error: string };
const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

// Add a departure (batch/date) to an existing trek. Service-role behind the
// admin gate. Revalidates the booking page so the new date shows immediately.
export async function createDeparture(raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();

  const parsed = departureSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const d = parsed.data;

  const { error } = await admin.from("trek_departures").insert({
    trek_id: d.trek_id,
    start_date: d.start_date,
    end_date: blank(d.end_date),
    start_time: blank(d.start_time),
    capacity: d.capacity,
    price_override: d.price_override != null ? Math.round(d.price_override * 100) : null,
    status: d.status,
  });
  if (error) {
    console.error("[createDeparture] insert failed:", error.message);
    return { ok: false, error: "Could not add the date. Please try again." };
  }

  const { data: trek } = await admin.from("treks").select("slug").eq("id", d.trek_id).maybeSingle();
  revalidatePath("/admin");
  if (trek?.slug) revalidatePath(`/book/${trek.slug}`);
  return { ok: true, slug: trek?.slug };
}
