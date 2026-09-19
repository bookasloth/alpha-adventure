"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { createDraftSchema, emailSchema, otpSchema } from "@/domain/booking/schema";
import { sendBookingPendingEmail } from "@/lib/email";

const DRAFT_COOKIE = "aa_draft";

type Result<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; error: string };

// ── 1. Guest creates a booking draft (no account). Server prices it. ────────
export async function createDraft(raw: unknown): Promise<Result<{ bookingId: string; total: number }>> {
  const parsed = createDraftSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const input = parsed.data;

  const admin = createAdminClient();

  const { data: trek } = await admin
    .from("treks")
    .select("id,title,base_price,status,deleted_at")
    .eq("id", input.trek_id)
    .maybeSingle();
  if (!trek || trek.status !== "published" || trek.deleted_at) return { ok: false, error: "Trek is not bookable." };

  const { data: dep } = await admin
    .from("trek_departures")
    .select("id,trek_id,start_date,status,capacity,booked_seats,price_override")
    .eq("id", input.departure_id)
    .maybeSingle();
  if (!dep || dep.trek_id !== input.trek_id || dep.status === "cancelled")
    return { ok: false, error: "Departure is not bookable." };

  const seats = input.adults + input.children;
  if (dep.booked_seats + seats > dep.capacity) return { ok: false, error: "Not enough seats left on this departure." };

  // Server-authoritative price (never trust the client).
  const { data: priced, error: priceErr } = await admin.rpc("price_booking", {
    _trek_id: input.trek_id,
    _departure_id: input.departure_id,
    _adults: input.adults,
    _children: input.children,
    _addons: input.addons,
  });
  if (priceErr || !priced) return { ok: false, error: "Could not price this booking." };
  const p = priced as Record<string, number>;

  const draftToken = crypto.randomUUID();
  const { data: booking, error: insErr } = await admin
    .from("bookings")
    .insert({
      user_id: null,
      draft_token: draftToken,
      trek_id: input.trek_id,
      departure_id: input.departure_id,
      status: "draft",
      adults: input.adults,
      children: input.children,
      contact_name: input.contact_name,
      contact_phone: input.contact_phone,
      currency: "INR",
      price_adult: p.price_adult,
      price_child: p.price_child,
      addons_total: p.addons_total,
      subtotal: p.subtotal,
      grand_total: p.grand_total,
      trek_title: trek.title,
      departure_date: dep.start_date,
    })
    .select("id")
    .single();
  if (insErr || !booking) return { ok: false, error: "Could not start your booking." };

  if (input.travellers.length) {
    await admin.from("booking_travellers").insert(
      input.travellers.map((t, i) => ({ booking_id: booking.id, ...t, position: i })),
    );
  }
  if (input.addons.length) {
    const { data: cat } = await admin
      .from("trek_addons")
      .select("id,name,price,active")
      .eq("trek_id", input.trek_id)
      .in("id", input.addons.map((a) => a.addon_id));
    const rows = input.addons
      .map((a) => {
        const row = (cat ?? []).find((c) => c.id === a.addon_id && c.active);
        if (!row) return null;
        return {
          booking_id: booking.id,
          addon_id: a.addon_id,
          name: row.name,
          unit_price: row.price,
          quantity: a.quantity,
          line_total: row.price * a.quantity,
        };
      })
      .filter(Boolean) as Record<string, unknown>[];
    if (rows.length) await admin.from("booking_addons").insert(rows);
  }

  cookies().set(DRAFT_COOKIE, draftToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  return { ok: true, bookingId: booking.id, total: p.grand_total };
}

// ── 2. Send an email OTP for this draft (draft -> pending_auth). ────────────
export async function sendBookingOtp(bookingId: string, rawEmail: unknown): Promise<Result> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email." };
  const email = parsed.data;

  const token = cookies().get(DRAFT_COOKIE)?.value;
  if (!token) return { ok: false, error: "Your booking session expired. Please start again." };

  const admin = createAdminClient();
  const { data: b } = await admin
    .from("bookings")
    .select("id,draft_token,status")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b || b.draft_token !== token) return { ok: false, error: "Booking not found." };
  if (b.status !== "draft" && b.status !== "pending_auth")
    return { ok: false, error: "This booking can no longer be verified." };

  await admin.from("bookings").update({ contact_email: email, status: "pending_auth" }).eq("id", bookingId);

  const supabase = createClient(cookies());
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) return { ok: false, error: "Could not send the code. Please try again." };
  return { ok: true };
}

// ── 3. Verify OTP -> account -> link draft -> reserve seats (pending_payment).
export async function verifyBookingOtp(
  bookingId: string,
  rawEmail: unknown,
  rawCode: unknown,
): Promise<Result<{ reference: string }>> {
  const email = emailSchema.safeParse(rawEmail);
  const code = otpSchema.safeParse(rawCode);
  if (!email.success) return { ok: false, error: "Invalid email." };
  if (!code.success) return { ok: false, error: code.error.issues[0]?.message ?? "Invalid code." };

  const token = cookies().get(DRAFT_COOKIE)?.value;
  if (!token) return { ok: false, error: "Your booking session expired. Please start again." };

  const supabase = createClient(cookies());
  const { data: auth, error: otpErr } = await supabase.auth.verifyOtp({
    email: email.data,
    token: code.data,
    type: "email",
  });
  if (otpErr || !auth.user) return { ok: false, error: "That code is incorrect or expired." };

  const admin = createAdminClient();
  const { error: linkErr } = await admin.rpc("link_booking_to_user", {
    _booking_id: bookingId,
    _draft_token: token,
    _user_id: auth.user.id,
  });
  if (linkErr) return { ok: false, error: "Could not attach the booking to your account." };

  const { data: finalized, error: finErr } = await admin.rpc("finalize_booking", {
    _booking_id: bookingId,
    _expected_total: null,
  });
  if (finErr) return { ok: false, error: "Those seats were just taken. Please pick another departure." };

  cookies().delete(DRAFT_COOKIE);
  const b = finalized as {
    reference?: string;
    trek_title?: string;
    departure_date?: string | null;
    adults?: number;
    children?: number;
    grand_total?: number;
  } | null;
  if (b?.reference) {
    await sendBookingPendingEmail({
      to: email.data,
      reference: b.reference,
      trekTitle: b.trek_title ?? "your trek",
      departureDate: b.departure_date ?? null,
      seats: (b.adults ?? 0) + (b.children ?? 0),
      total: b.grand_total ?? 0,
    });
  }
  return { ok: true, reference: b?.reference ?? "" };
}

// ── Resend the OTP ──────────────────────────────────────────────────────────
export async function resendBookingOtp(rawEmail: unknown): Promise<Result> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return { ok: false, error: "Invalid email." };
  const supabase = createClient(cookies());
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, error: "Could not resend the code." };
  return { ok: true };
}
