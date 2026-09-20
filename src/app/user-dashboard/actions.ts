"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const str = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
};

const CANCELLABLE = new Set(["draft", "pending_auth", "pending_payment", "payment_failed", "deposit_paid", "confirmed"]);

// Update the signed-in user's profile (own-row RLS: profiles_update_own).
export async function updateProfile(data: Record<string, unknown>): Promise<Result> {
  const supabase = createClient(cookies());
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
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { data, error } = await supabase
    .from("booking_travellers")
    .select("full_name,gender,is_lead,phone,emergency_contact_phone,position")
    .eq("booking_id", bookingId)
    .order("position");
  if (error) return { ok: false, error: "Could not load travellers." };
  return { ok: true, travellers: data ?? [] };
}

// Cancel a booking the user owns (respects the DB state-machine trigger).
export async function cancelBooking(bookingId: string): Promise<Result> {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const admin = createAdminClient();
  const { data: b } = await admin.from("bookings").select("id,user_id,status").eq("id", bookingId).maybeSingle();
  if (!b || b.user_id !== user.id) return { ok: false, error: "Booking not found." };
  if (!CANCELLABLE.has(b.status)) return { ok: false, error: "This booking can no longer be cancelled." };

  const { error } = await admin
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId);
  if (error) return { ok: false, error: "Could not cancel the booking." };
  revalidatePath("/user-dashboard");
  return { ok: true };
}
