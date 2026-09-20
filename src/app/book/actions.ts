"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { emailSchema, otpSchema } from "@/domain/booking/schema";
import { createDraftBooking, linkAndFinalize, confirmMockPayment } from "@/domain/booking/service";
import { sendBookingPendingEmail, sendBookingConfirmedEmail, sendOtpEmail } from "@/lib/email";
import type { SupabaseClient } from "@supabase/supabase-js";

const DRAFT_COOKIE = "aa_draft";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

// Mint an email OTP without using Supabase's own email delivery: ensure the
// user exists (idempotent, pre-confirmed so magiclink works), ask Supabase to
// generate the link/OTP, then email the code ourselves via SMTP.
// verifyOtp(type:"email") on the other side validates this same code.
async function mintAndSendOtp(admin: SupabaseClient, email: string) {
  await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const code = data?.properties?.email_otp;
  if (error || !code) throw new Error("mint failed");
  await sendOtpEmail(email, code);
}

function setDraftCookie(token: string) {
  cookies().set(DRAFT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

// The draft token is a per-guest bearer secret. Primary store is an httpOnly
// cookie; the client also holds it (from createDraft) as a fallback so the flow
// survives a reload/HMR blip.
function draftTokenFrom(fallback?: string) {
  return cookies().get(DRAFT_COOKIE)?.value ?? fallback ?? null;
}

// ── 1. Guest creates a booking draft (no account). Server prices it. ────────
export async function createDraft(raw: unknown): Promise<Result<{ bookingId: string; total: number; token: string }>> {
  try {
    const admin = createAdminClient();
    const { bookingId, draftToken, total } = await createDraftBooking(admin, raw);
    setDraftCookie(draftToken);
    return { ok: true, bookingId, total, token: draftToken };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── 2. Send an email OTP for this draft (draft -> pending_auth). ────────────
export async function sendBookingOtp(bookingId: string, rawEmail: unknown, token?: string): Promise<Result> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email." };

  const draftToken = draftTokenFrom(token);
  if (!draftToken) return { ok: false, error: "Your booking session expired. Please start again." };

  const admin = createAdminClient();
  const { data: b } = await admin.from("bookings").select("id,draft_token,status").eq("id", bookingId).maybeSingle();
  if (!b || b.draft_token !== draftToken) return { ok: false, error: "Booking not found." };
  if (b.status !== "draft" && b.status !== "pending_auth")
    return { ok: false, error: "This booking can no longer be verified." };

  await admin.from("bookings").update({ contact_email: parsed.data, status: "pending_auth" }).eq("id", bookingId);

  try {
    await mintAndSendOtp(admin, parsed.data);
  } catch {
    return { ok: false, error: "Could not send the code. Please try again." };
  }
  return { ok: true };
}

// ── 3. Verify OTP -> account -> link draft -> reserve seats (pending_payment).
export async function verifyBookingOtp(
  bookingId: string,
  rawEmail: unknown,
  rawCode: unknown,
  token?: string,
): Promise<Result<{ reference: string }>> {
  const email = emailSchema.safeParse(rawEmail);
  const code = otpSchema.safeParse(rawCode);
  if (!email.success) return { ok: false, error: "Invalid email." };
  if (!code.success) return { ok: false, error: code.error.issues[0]?.message ?? "Invalid code." };

  const draftToken = draftTokenFrom(token);
  if (!draftToken) return { ok: false, error: "Your booking session expired. Please start again." };

  const supabase = createClient(cookies());
  const { data: auth, error: otpErr } = await supabase.auth.verifyOtp({
    email: email.data,
    token: code.data,
    type: "email",
  });
  if (otpErr || !auth.user) return { ok: false, error: "That code is incorrect or expired." };

  try {
    const admin = createAdminClient();
    const finalized = await linkAndFinalize(admin, bookingId, draftToken, auth.user.id);
    cookies().delete(DRAFT_COOKIE);
    await sendBookingPendingEmail({
      to: email.data,
      reference: finalized.reference,
      trekTitle: finalized.trek_title ?? "your trek",
      departureDate: finalized.departure_date,
      seats: finalized.adults + finalized.children,
      total: finalized.grand_total,
    });
    return { ok: true, reference: finalized.reference };
  } catch (e) {
    const msg = (e as Error).message.toLowerCase().includes("seat")
      ? "Those seats were just taken. Please pick another departure."
      : "Could not complete your booking. Please try again.";
    return { ok: false, error: msg };
  }
}

export async function resendBookingOtp(rawEmail: unknown): Promise<Result> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return { ok: false, error: "Invalid email." };
  try {
    await mintAndSendOtp(createAdminClient(), parsed.data);
  } catch {
    return { ok: false, error: "Could not resend the code." };
  }
  return { ok: true };
}

// ── 4. Mock payment (test mode) -> confirmed. Authorised via the signed-in user.
// PhonePe replaces this with a server-verified webhook flow.
export async function payMockBooking(bookingId: string): Promise<Result<{ reference: string }>> {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please verify your email first." };

  const admin = createAdminClient();
  const { data: b } = await admin
    .from("bookings")
    .select("id,user_id,contact_email")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b || b.user_id !== user.id) return { ok: false, error: "Booking not found." };

  try {
    const confirmed = await confirmMockPayment(admin, bookingId);
    if (b.contact_email) {
      await sendBookingConfirmedEmail({
        to: b.contact_email,
        reference: confirmed.reference,
        trekTitle: confirmed.trek_title ?? "your trek",
        departureDate: confirmed.departure_date,
        seats: confirmed.adults + confirmed.children,
        total: confirmed.grand_total,
      });
    }
    return { ok: true, reference: confirmed.reference };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
