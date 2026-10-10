"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { background } from "@/lib/after";
import { BOOKING_EMAIL_COLS, bookingEmailOf, sendBookingCancelledEmail } from "@/lib/email";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const str = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
};

const CANCELLABLE = new Set(["draft", "pending_auth", "pending_payment", "payment_failed", "deposit_paid", "confirmed"]);

// Update the signed-in user's profile (own-row RLS: profiles_update_own).
export async function updateProfile(data: Record<string, unknown>): Promise<Result> {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const patch = {
    first_name: str(data.first_name),
    last_name: str(data.last_name),
    phone: str(data.phone),
    address: str(data.address),
    date_of_birth: str(data.date_of_birth),
    gender: str(data.gender),
    blood_group: str(data.blood_group),
    medical_conditions: str(data.medical_conditions),
    emergency_contact_name: str(data.emergency_contact_name),
    emergency_contact_phone: str(data.emergency_contact_phone),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return { ok: false, error: "Could not save your profile." };
  revalidatePath("/user-dashboard");
  return { ok: true };
}

// Travellers for one of the user's own bookings (own-row RLS: trav_owner).
export async function getBookingTravellers(bookingId: string): Promise<Result<{ travellers: any[] }>> {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  // Audit L5: explicit app-level ownership check, not just the trav_owner RLS
  // policy - the booking row must match the caller's user_id or nothing comes
  // back. Travellers are embedded so it's one round trip, not two.
  const { data: own, error } = await supabase
    .from("bookings")
    .select("id, booking_travellers(full_name,gender,is_lead,phone,emergency_contact_phone,position)")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .order("position", { referencedTable: "booking_travellers" })
    .maybeSingle();
  if (error) return { ok: false, error: "Could not load travellers." };
  if (!own) return { ok: false, error: "Booking not found." };
  return { ok: true, travellers: own.booking_travellers ?? [] };
}

// Cancel a booking the user owns (respects the DB state-machine trigger).
export async function cancelBooking(bookingId: string): Promise<Result> {
  const supabase = createClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  // One conditional update: ownership + cancellable status are part of the
  // WHERE, so there's no read-then-write gap and one fewer round trip.
  const { data: rows, error } = await createAdminClient()
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .in("status", [...CANCELLABLE])
    .select(BOOKING_EMAIL_COLS);
  if (error) return { ok: false, error: "Could not cancel the booking." };
  if (!rows?.length) return { ok: false, error: "This booking can no longer be cancelled." };
  const mail = bookingEmailOf(rows[0]);
  if (mail) background(sendBookingCancelledEmail(mail, "customer"));
  revalidatePath("/user-dashboard");
  return { ok: true };
}
