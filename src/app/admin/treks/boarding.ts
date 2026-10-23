import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

// Boarding (pickup) locations per trek — shared by createTrek / updateTrek.
// Plain module (NOT "use server") so it can export a schema + constant.
export const MAX_BOARDING = 4;

export const boardingSchema = z.object({
  id: z.string().uuid().optional(), // present for an existing row (keeps booking FKs stable)
  name: z.string().trim().min(1, "Boarding name required").max(120),
  subtext: z.string().trim().max(200).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(1_000_000), // ₹ per traveller, converted to paise on save
});

// Cap server-side too — the UI hides "Add" at MAX_BOARDING but the client is untrusted.
export const boardingListSchema = z.array(boardingSchema).default([]).transform((a) => a.slice(0, MAX_BOARDING));

export type BoardingInput = z.infer<typeof boardingSchema>;

const toPaise = (r: number) => Math.round(r * 100);
const blank = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

// Reconcile a trek's boarding rows to the submitted list. Existing rows keep their id
// (updated in place) so bookings that reference them stay linked; rows missing from
// the list are deleted (bookings.boarding_location_id is ON DELETE SET NULL, and the
// booking keeps its boarding_name/boarding_total snapshot).
export async function reconcileBoarding(admin: SupabaseClient, trekId: string, rows: BoardingInput[]) {
  const { data: existing } = await admin.from("trek_boarding_locations").select("id").eq("trek_id", trekId);
  const have = new Set((existing ?? []).map((r) => r.id as string));
  const keepIds = rows.map((r) => r.id).filter((id): id is string => !!id && have.has(id));

  const del = admin.from("trek_boarding_locations").delete().eq("trek_id", trekId);
  const { error: delErr } = keepIds.length ? await del.not("id", "in", `(${keepIds.join(",")})`) : await del;
  if (delErr) console.error("[boarding] delete:", delErr.message);

  const toRow = (r: BoardingInput, position: number) => ({
    trek_id: trekId, name: r.name, subtext: blank(r.subtext), price: toPaise(r.price), position,
  });
  const updates = rows.flatMap((r, i) => (r.id && have.has(r.id) ? [{ id: r.id, ...toRow(r, i) }] : []));
  const inserts = rows.flatMap((r, i) => (r.id && have.has(r.id) ? [] : [toRow(r, i)]));
  if (updates.length) {
    const { error } = await admin.from("trek_boarding_locations").upsert(updates);
    if (error) console.error("[boarding] update:", error.message);
  }
  if (inserts.length) {
    const { error } = await admin.from("trek_boarding_locations").insert(inserts);
    if (error) console.error("[boarding] insert:", error.message);
  }
}
