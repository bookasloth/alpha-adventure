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

const updateDepartureSchema = departureSchema.omit({ trek_id: true });

type Admin = Awaited<ReturnType<typeof requireAdmin>>["admin"];
async function revalidateBookFor(admin: Admin, departureId: string) {
  const { data: dep } = await admin.from("trek_departures").select("trek_id").eq("id", departureId).maybeSingle();
  if (dep?.trek_id) {
    const { data: trek } = await admin.from("treks").select("slug").eq("id", dep.trek_id).maybeSingle();
    if (trek?.slug) revalidatePath(`/book/${trek.slug}`);
  }
  revalidatePath("/admin");
}

export async function updateDeparture(id: string, raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = updateDepartureSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const d = parsed.data;
  const { error } = await admin.from("trek_departures").update({
    start_date: d.start_date,
    end_date: blank(d.end_date),
    start_time: blank(d.start_time),
    capacity: d.capacity,
    price_override: d.price_override != null ? Math.round(d.price_override * 100) : null,
    status: d.status,
  }).eq("id", id);
  if (error) { console.error("[updateDeparture]", error.message); return { ok: false, error: "Could not save the date." }; }
  await revalidateBookFor(admin, id);
  return { ok: true };
}

// Hard delete; if the date has bookings the FK blocks it — tell the admin to
// cancel it (set status) instead.
export async function deleteDeparture(id: string): Promise<Result> {
  const { admin } = await requireAdmin();
  await revalidateBookFor(admin, id); // capture slug before the row is gone
  const { error } = await admin.from("trek_departures").delete().eq("id", id);
  if (error) {
    console.error("[deleteDeparture]", error.message);
    return { ok: false, error: "Can't delete a date with bookings — set its status to Cancelled instead." };
  }
  revalidatePath("/admin");
  return { ok: true };
}
