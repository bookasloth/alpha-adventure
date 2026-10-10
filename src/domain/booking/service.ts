import type { SupabaseClient } from "@supabase/supabase-js";
import { istToday } from "@/lib/date";
import { createDraftSchema } from "./schema";

// Booking core — pure of Next/cookies so it is reusable by server actions AND
// integration tests. Takes an admin (service-role) client. Throws on failure;
// callers translate to their own result shape.
//
// NOTE: the mock payment path exists so the guest -> account -> payment ->
// confirmed cycle is testable end-to-end now. Real PhonePe implements the same
// PaymentGateway seam (src/lib/payment/gateway.ts) in the payment phase.

type Admin = SupabaseClient;

export type DraftResult = { bookingId: string; draftToken: string; total: number };

export async function createDraftBooking(admin: Admin, raw: unknown): Promise<DraftResult> {
  const input = createDraftSchema.parse(raw);

  const { data: trek } = await admin
    .from("treks")
    .select("id,title,base_price,status,deleted_at")
    .eq("id", input.trek_id)
    .maybeSingle();
  if (!trek || trek.status !== "published" || trek.deleted_at) throw new Error("Trek is not bookable.");

  const { data: dep } = await admin
    .from("trek_departures")
    .select("id,trek_id,start_date,status,capacity,booked_seats")
    .eq("id", input.departure_id)
    .maybeSingle();
  // IST "today" (business tz) — reject client-tampered past/unlisted departures.
  // price_booking enforces the same gate in SQL; this gives a clean early error.
  const todayIST = istToday();
  if (
    !dep ||
    dep.trek_id !== input.trek_id ||
    dep.status === "cancelled" ||
    !dep.start_date ||
    dep.start_date < todayIST
  )
    throw new Error("Departure is not bookable.");

  const seats = input.adults + input.children;
  if (dep.booked_seats + seats > dep.capacity) throw new Error("Not enough seats left.");

  const { data: priced, error: priceErr } = await admin.rpc("price_booking", {
    _trek_id: input.trek_id,
    _departure_id: input.departure_id,
    _adults: input.adults,
    _children: input.children,
    _addons: input.addons,
  });
  if (priceErr || !priced) throw new Error(`Pricing failed: ${priceErr?.message ?? "unknown"}`);
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
      // Drafts self-expire so the cleanup cron (expire_stale_bookings) can prune
      // abandoned ones; finalize resets this to a 30-min payment hold.
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (insErr || !booking) throw new Error(`Could not create draft: ${insErr?.message ?? "unknown"}`);

  if (input.travellers.length) {
    await admin
      .from("booking_travellers")
      .insert(input.travellers.map((t, i) => ({ booking_id: booking.id, ...t, position: i })));
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
        return row
          ? { booking_id: booking.id, addon_id: a.addon_id, name: row.name, unit_price: row.price, quantity: a.quantity, line_total: row.price * a.quantity }
          : null;
      })
      .filter(Boolean) as Record<string, unknown>[];
    if (rows.length) await admin.from("booking_addons").insert(rows);
  }

  return { bookingId: booking.id, draftToken, total: p.grand_total };
}

export type BookingRow = {
  id: string;
  reference: string;
  status: string;
  grand_total: number;
  amount_paid: number;
  trek_title: string | null;
  departure_date: string | null;
  adults: number;
  children: number;
  // Present when the row comes from a full-row RPC (finalize/confirm); used for
  // the itemized receipt email. Optional because the col-subset selects omit them.
  price_adult?: number;
  price_child?: number;
  addons_total?: number;
};

// After OTP verify: attach the draft to the account + reserve seats (pending_payment).
export async function linkAndFinalize(
  admin: Admin,
  bookingId: string,
  draftToken: string,
  userId: string,
): Promise<BookingRow> {
  const { error: linkErr } = await admin.rpc("link_booking_to_user", {
    _booking_id: bookingId,
    _draft_token: draftToken,
    _user_id: userId,
  });
  if (linkErr) throw new Error(`Link failed: ${linkErr.message}`);

  const { data: finalized, error: finErr } = await admin.rpc("finalize_booking", {
    _booking_id: bookingId,
    _expected_total: null,
  });
  if (finErr) throw new Error(`Finalize failed: ${finErr.message}`);
  return finalized as BookingRow;
}

// Mock payment: records a successful payment + moves pending_payment -> confirmed
// atomically in ONE transaction (confirm_mock_payment RPC, migration 0019). The
// row lock makes it idempotent, so a double-click can't double-pay. PhonePe
// replaces this with a server-verified webhook flow.
export async function confirmMockPayment(admin: Admin, bookingId: string): Promise<BookingRow> {
  const { data, error } = await admin.rpc("confirm_mock_payment", { _booking_id: bookingId });
  if (error) {
    if (/booking not found/i.test(error.message)) throw new Error("Booking not found.");
    throw new Error(`Confirm failed: ${error.message}`);
  }
  if (!data) throw new Error("Booking not found.");
  return data as BookingRow;
}

const BOOKING_COLS = "id,reference,status,grand_total,amount_paid,trek_title,departure_date,adults,children";

// PhonePe: create the pending payment row + return the merchant txn id to
// initiate against. Booking must be pending_payment.
export async function createPhonePePayment(admin: Admin, bookingId: string): Promise<{ merchantTransactionId: string; amountPaise: number }> {
  const { data: b } = await admin.from("bookings").select("id,status,grand_total").eq("id", bookingId).maybeSingle();
  if (!b) throw new Error("Booking not found.");
  if (b.status !== "pending_payment") throw new Error(`Booking not payable (is ${b.status}).`);

  const mtx = `AA${Date.now().toString(36)}${bookingId.replace(/-/g, "").slice(0, 12)}`.slice(0, 38);
  const { error } = await admin.from("payments").insert({
    booking_id: bookingId,
    provider: "phonepe",
    merchant_order_id: mtx,
    amount: b.grand_total,
    currency: "INR",
    status: "pending",
    idempotency_key: mtx,
    kind: "full",
  });
  if (error) throw new Error(`Payment insert failed: ${error.message}`);
  return { merchantTransactionId: mtx, amountPaise: b.grand_total };
}

// PhonePe: after a server-verified success, settle through the same locked,
// idempotent DB function as Razorpay (settle_gateway_payment, 0026), so a
// redirect and a server callback arriving together can't both confirm.
export async function confirmPhonePePayment(admin: Admin, merchantTransactionId: string, providerTxnId: string | null, paidAmount?: number | null): Promise<BookingRow | null> {
  const { data: pay } = await admin.from("payments").select("amount").eq("merchant_order_id", merchantTransactionId).maybeSingle();
  if (!pay) return null;
  const { data, error } = await admin.rpc("settle_gateway_payment", {
    _order_id: merchantTransactionId,
    _txn_id: providerTxnId ?? merchantTransactionId,
    _amount: paidAmount ?? (pay as { amount: number }).amount,
    _method: "phonepe",
    _raw: { provider: "phonepe", providerTxnId, paidAmount: paidAmount ?? null },
  });
  if (error) { console.error("[phonepe] settle failed:", error.message); return null; }
  const res = data as { outcome: string; booking_id?: string };
  if (res.outcome !== "confirmed" && res.outcome !== "already_settled") {
    // amount_mismatch / refund_required: money needs a manual PhonePe refund.
    console.error(`[phonepe] ${merchantTransactionId} not confirmed: ${res.outcome} — refund manually.`);
    return null;
  }
  const { data: b } = await admin.from("bookings").select(BOOKING_COLS).eq("id", res.booking_id!).single();
  return (b as BookingRow) ?? null;
}
