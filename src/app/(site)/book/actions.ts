"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { emailSchema, passwordSchema, nameSchema, passwordDisallowsIdentity } from "@/domain/booking/schema";
import { createDraftBooking, linkAndFinalize, confirmMockPayment, createPhonePePayment } from "@/domain/booking/service";
import { isPhonePeEnabled, phonePeInitiate, REDIRECT_BASE } from "@/lib/payment/phonepe";
import { sendBookingPendingEmail, sendBookingConfirmedEmail } from "@/lib/email";
import { sendVerifyEmail } from "@/lib/verifyEmail";
import { withTimeout } from "@/lib/withTimeout";
import { background } from "@/lib/after";
import { limitByIp } from "@/lib/rateLimit";
import { tokenSigningSecret } from "@/lib/signing";

const DRAFT_COOKIE = "aa_draft";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

// signInWithPassword establishes a session, but cookies written inside a
// value-returning Server Action don't reach the browser here (only a redirect
// commits them — see login/actions.ts). So the pay step can't rely on that
// session: authenticateBooking returns an HMAC-signed bearer of the linked user
// id, the client passes it back to the pay actions (exactly like the draft
// token), and they authorise off it — falling back to a real session if one is
// present. The bearer only authorises paying the caller's own finalized
// booking, and can't be forged without the service-role key.
const paySecret = tokenSigningSecret;
function signPay(userId: string) {
  const mac = crypto.createHmac("sha256", paySecret()).update(userId).digest("hex");
  return `${userId}.${mac}`;
}
function verifyPay(value: string | undefined | null): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const good = crypto.createHmac("sha256", paySecret()).update(userId).digest("hex");
  const a = Buffer.from(mac);
  const b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}
// The signed-in user id for the pay step: a real session if committed, else the
// signed bearer the client carries from verifyBookingOtp.
async function payUserId(supabase: ReturnType<typeof createClient>, payToken?: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? verifyPay(payToken);
}

async function setDraftCookie(token: string) {
  (await cookies()).set(DRAFT_COOKIE, token, {
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
async function draftTokenFrom(fallback?: string) {
  return (await cookies()).get(DRAFT_COOKIE)?.value ?? fallback ?? null;
}

// ── 1. Guest creates a booking draft (no account). Server prices it. ────────
export async function createDraft(raw: unknown): Promise<Result<{ bookingId: string; total: number; token: string }>> {
  if (!(await limitByIp("book-draft", 10, 60))) return { ok: false, error: "Too many requests. Please wait a minute." };
  try {
    const admin = createAdminClient();
    const { bookingId, draftToken, total } = await createDraftBooking(admin, raw);
    await setDraftCookie(draftToken);
    return { ok: true, bookingId, total, token: draftToken };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── 2+3. Identity at checkout: sign in OR register (email+password), then link
// the draft and reserve seats (pending_payment). Seats are never consumed until
// a real user id is held. Returns the HMAC payToken bearer for the pay step.
export async function authenticateBooking(
  bookingId: string,
  raw: { name?: unknown; email: unknown; password: unknown; mode: "signin" | "register" },
  token?: string,
): Promise<Result<{ reference: string; payToken: string }>> {
  if (!(await limitByIp("book-auth", 10, 60))) return { ok: false, error: "Too many attempts. Please wait a minute." };
  const email = emailSchema.safeParse(raw.email);
  if (!email.success) return { ok: false, error: "Invalid email." };
  if (typeof raw.password !== "string" || !raw.password) return { ok: false, error: "Enter your password." };

  const draftToken = await draftTokenFrom(token);
  if (!draftToken) return { ok: false, error: "Your booking session expired. Please start again." };

  const admin = createAdminClient();
  const { data: b } = await admin.from("bookings").select("id,draft_token,status").eq("id", bookingId).maybeSingle();
  if (!b || b.draft_token !== draftToken) return { ok: false, error: "Booking not found." };
  if (b.status !== "draft" && b.status !== "pending_auth")
    return { ok: false, error: "This booking can no longer be verified." };
  await admin.from("bookings").update({ contact_email: email.data, status: "pending_auth" }).eq("id", bookingId);

  const supabase = createClient(await cookies());
  let userId: string;
  if (raw.mode === "register") {
    const name = nameSchema.safeParse(raw.name);
    const pw = passwordSchema.safeParse(raw.password);
    if (!name.success) return { ok: false, error: name.error.issues[0]!.message };
    if (!pw.success) return { ok: false, error: pw.error.issues[0]!.message };
    if (!passwordDisallowsIdentity(pw.data, { name: name.data, email: email.data }))
      return { ok: false, error: "Password must not contain your name or email." };
    let created;
    try {
      created = await withTimeout(admin.auth.admin.createUser({
        email: email.data, password: pw.data, email_confirm: true, user_metadata: { first_name: name.data },
      }), 10000);
    } catch {
      return { ok: false, error: "That took too long — please try again." };
    }
    if (created.error || !created.data.user) {
      const msg = (created.error?.message ?? "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists"))
        return { ok: false, error: "An account with this email already exists — switch to Sign in." };
      return { ok: false, error: "Could not create your account. Please try again." };
    }
    userId = created.data.user.id;
    background(sendVerifyEmail(userId, email.data));
    await supabase.auth.signInWithPassword({ email: email.data, password: pw.data }); // best-effort session
  } else {
    let res;
    try {
      res = await withTimeout(supabase.auth.signInWithPassword({ email: email.data, password: raw.password }), 10000);
    } catch {
      return { ok: false, error: "That took too long — please try again." };
    }
    if (res.error || !res.data.user) return { ok: false, error: "Email or password is incorrect." };
    userId = res.data.user.id;
  }

  try {
    const finalized = await linkAndFinalize(admin, bookingId, draftToken, userId);
    (await cookies()).delete(DRAFT_COOKIE);
    const payToken = signPay(userId); // authorises the pay step; session cookie doesn't survive this action
    // Non-blocking: a "we've held your spot" notice must not delay confirming
    // the reservation, and a mail failure must not fail a finalized booking.
    background(
      sendBookingPendingEmail({
        to: email.data,
        reference: finalized.reference,
        trekTitle: finalized.trek_title ?? "your trek",
        departureDate: finalized.departure_date,
        seats: finalized.adults + finalized.children,
        total: finalized.grand_total,
      }),
    );
    return { ok: true, reference: finalized.reference, payToken };
  } catch (e) {
    const msg = (e as Error).message.toLowerCase().includes("seat")
      ? "Those seats were just taken. Please pick another departure."
      : "Could not complete your booking. Please try again.";
    return { ok: false, error: msg };
  }
}

// ── 4b. Start payment. PhonePe (sandbox) when configured, else the mock path.
// Returns a redirectUrl (PhonePe hosted page) or a reference (mock = done).
export async function startPayment(bookingId: string, payToken?: string): Promise<Result<{ redirectUrl?: string; reference?: string }>> {
  const supabase = createClient(await cookies());
  const userId = await payUserId(supabase, payToken);
  if (!userId) return { ok: false, error: "Please verify your email first." };

  const admin = createAdminClient();
  const { data: b } = await admin.from("bookings").select("id,user_id").eq("id", bookingId).maybeSingle();
  if (!b || b.user_id !== userId) return { ok: false, error: "Booking not found." };

  if (!isPhonePeEnabled()) {
    const r = await payMockBooking(bookingId, payToken);
    return r.ok ? { ok: true, reference: r.reference } : r;
  }
  try {
    const { merchantTransactionId, amountPaise } = await createPhonePePayment(admin, bookingId);
    const cb = `${REDIRECT_BASE}/api/phonepe/callback?mtx=${merchantTransactionId}`;
    const init = await phonePeInitiate({ merchantTransactionId, amountPaise, userId, redirectUrl: cb, callbackUrl: cb });
    if (!init.ok) return { ok: false, error: init.error };
    return { ok: true, redirectUrl: init.redirectUrl };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── 4. Mock payment (test mode) -> confirmed. Authorised via the signed-in user.
// PhonePe replaces this with a server-verified webhook flow.
export async function payMockBooking(bookingId: string, payToken?: string): Promise<Result<{ reference: string }>> {
  // Audit H1: the mock path must never confirm a booking once a real gateway is
  // live. startPayment only routes here when PhonePe is disabled, but this is an
  // exported Server Action (directly callable), so it guards itself too.
  if (isPhonePeEnabled()) return { ok: false, error: "Payment required." };
  const supabase = createClient(await cookies());
  const userId = await payUserId(supabase, payToken);
  if (!userId) return { ok: false, error: "Please verify your email first." };

  const admin = createAdminClient();
  const { data: b } = await admin
    .from("bookings")
    .select("id,user_id,contact_email")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b || b.user_id !== userId) return { ok: false, error: "Booking not found." };

  try {
    const confirmed = await confirmMockPayment(admin, bookingId);
    if (b.contact_email) {
      background(
        sendBookingConfirmedEmail({
          to: b.contact_email,
          reference: confirmed.reference,
          trekTitle: confirmed.trek_title ?? "your trek",
          departureDate: confirmed.departure_date,
          seats: confirmed.adults + confirmed.children,
          total: confirmed.grand_total,
          adults: confirmed.adults,
          children: confirmed.children,
          priceAdult: confirmed.price_adult,
          priceChild: confirmed.price_child,
          addonsTotal: confirmed.addons_total,
        }),
      );
    }
    return { ok: true, reference: confirmed.reference };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
