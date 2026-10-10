"use server";

import { z } from "zod";
import { requireAdmin } from "./data";
import { revalidatePublicTrek } from "@/lib/revalidateTrek";
import { background } from "@/lib/after";
import { BOOKING_EMAIL_COLS, bookingEmailOf, sendDepartureChangedEmail, type DepartureChange } from "@/lib/email";

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
  revalidatePublicTrek(trek?.slug);
  return { ok: true, slug: trek?.slug };
}

const updateDepartureSchema = departureSchema.omit({ trek_id: true });

type Admin = Awaited<ReturnType<typeof requireAdmin>>["admin"];
async function trekSlugFor(admin: Admin, departureId: string) {
  const { data: dep } = await admin.from("trek_departures").select("trek_id").eq("id", departureId).maybeSingle();
  if (!dep?.trek_id) return undefined;
  const { data: trek } = await admin.from("treks").select("slug").eq("id", dep.trek_id).maybeSingle();
  return trek?.slug ?? undefined;
}

export async function updateDeparture(id: string, raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = updateDepartureSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const d = parsed.data;
  const { data: before } = await admin.from("trek_departures").select("start_date,status").eq("id", id).maybeSingle();
  const { error } = await admin.from("trek_departures").update({
    start_date: d.start_date,
    end_date: blank(d.end_date),
    start_time: blank(d.start_time),
    capacity: d.capacity,
    price_override: d.price_override != null ? Math.round(d.price_override * 100) : null,
    status: d.status,
  }).eq("id", id);
  if (error) { console.error("[updateDeparture]", error.message); return { ok: false, error: "Could not save the date." }; }
  if (before) await notifyDepartureChange(admin, id, before, d);
  revalidatePublicTrek(await trekSlugFor(admin, id));
  return { ok: true };
}

// Bookings that still expect to travel on a departure.
const ACTIVE_BOOKING = ["pending_payment", "payment_processing", "deposit_paid", "confirmed"];

// Tell booked customers when a departure is cancelled or moves to a new date.
// On a move, bookings carry the new date (it drives reminders + receipts) and
// get their reminder re-armed for the new date.
async function notifyDepartureChange(
  admin: Admin,
  id: string,
  before: { start_date: string | null; status: string | null },
  after: { start_date: string; status: string },
) {
  let change: DepartureChange | null = null;
  if (after.status === "cancelled" && before.status !== "cancelled") change = { kind: "cancelled" };
  else if (after.start_date !== before.start_date && after.status !== "cancelled")
    change = { kind: "moved", oldDate: before.start_date, newDate: after.start_date };
  if (!change) return;

  const { data: rows, error } = await admin
    .from("bookings").select(BOOKING_EMAIL_COLS).eq("departure_id", id).in("status", ACTIVE_BOOKING);
  if (error) { console.error("[updateDeparture] booking lookup failed:", error.message); return; }
  if (change.kind === "moved" && rows?.length) {
    const { error: e2 } = await admin.from("bookings")
      .update({ departure_date: after.start_date, reminder_sent_at: null })
      .eq("departure_id", id).in("status", ACTIVE_BOOKING);
    if (e2) console.error("[updateDeparture] booking date sync failed:", e2.message);
  }
  for (const row of rows ?? []) {
    // The email shows the original date for a cancellation, the old->new pair for a move.
    const mail = bookingEmailOf(row, { departureDate: change.kind === "moved" ? after.start_date : row.departure_date });
    if (mail) background(sendDepartureChangedEmail(mail, change));
  }
}

// Hard delete; if the date has bookings the FK blocks it — tell the admin to
// cancel it (set status) instead.
export async function deleteDeparture(id: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const slug = await trekSlugFor(admin, id); // capture slug before the row is gone
  const { error } = await admin.from("trek_departures").delete().eq("id", id);
  if (error) {
    console.error("[deleteDeparture]", error.message);
    return { ok: false, error: "Can't delete a date with bookings — set its status to Cancelled instead." };
  }
  revalidatePublicTrek(slug);
  return { ok: true };
}
