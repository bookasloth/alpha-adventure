import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createDraftBooking, linkAndFinalize, confirmMockPayment, createPhonePePayment, confirmPhonePePayment } from "./service";
import { computeDeposit } from "./pricing";

// Load .env.local (vitest does not inject it).
try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {
  /* no .env.local — test will skip */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RUN = Boolean(url && key);

(RUN ? describe : describe.skip)("booking cycle (integration, live DB)", () => {
  let admin: SupabaseClient;
  let userId = "";
  let bookingId = "";
  let departureId = "";
  let seatsReserved = 0;
  const email = `test+${Date.now()}@example.com`;

  beforeAll(() => {
    admin = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  });

  afterAll(async () => {
    // Self-cleaning: remove test rows and restore seats so the live DB stays clean.
    if (bookingId) {
      await admin.from("payments").delete().eq("booking_id", bookingId);
      await admin.from("bookings").delete().eq("id", bookingId);
    }
    if (departureId && seatsReserved) {
      await admin.rpc("release_departure_seats", { _departure_id: departureId, _seats: seatsReserved });
    }
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("guest → account → pending_payment → mock pay → confirmed", async () => {
    const { data: trek } = await admin
      .from("treks")
      .select("id,base_price,child_price")
      .eq("status", "published")
      .not("base_price", "is", null)
      .limit(1)
      .single();
    expect(trek).toBeTruthy();

    const { data: dep } = await admin
      .from("trek_departures")
      .select("id,capacity,booked_seats")
      .eq("trek_id", trek!.id)
      .neq("status", "cancelled")
      .order("start_date", { ascending: true })
      .limit(1)
      .single();
    expect(dep).toBeTruthy();
    departureId = dep!.id;

    // 1) Guest draft — server prices it (2 adults + 1 child @ adult rate).
    const draft = await createDraftBooking(admin, {
      trek_id: trek!.id,
      departure_id: dep!.id,
      adults: 2,
      children: 1,
      contact_name: "Test Guest",
      contact_phone: "9999999999",
      travellers: [],
      addons: [],
    });
    bookingId = draft.bookingId;
    // Authoritative server price: 2 adults at base + 1 child at child rate
    // (falls back to base when the trek has no child_price).
    const childRate = trek!.child_price ?? trek!.base_price;
    expect(draft.total).toBe(trek!.base_price * 2 + childRate);

    // 2) Fake verified account (mimics email-OTP verify → handle_new_user trigger).
    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    expect(userErr).toBeNull();
    userId = created!.user!.id;

    // Profile auto-created by the trigger.
    const { data: profile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
    expect(profile?.id).toBe(userId);

    // OTP-send step: draft → pending_auth. Then link + finalize (reserve seats).
    await admin.from("bookings").update({ status: "pending_auth", contact_email: email }).eq("id", bookingId);
    const finalized = await linkAndFinalize(admin, bookingId, draft.draftToken, userId);
    seatsReserved = 3;
    expect(finalized.status).toBe("pending_payment");

    // Seats actually reserved on the departure.
    const { data: depAfter } = await admin
      .from("trek_departures")
      .select("booked_seats")
      .eq("id", departureId)
      .single();
    expect(depAfter!.booked_seats).toBe(dep!.booked_seats + 3);

    // 3) Mock payment → confirmed.
    const confirmed = await confirmMockPayment(admin, bookingId);
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.amount_paid).toBe(draft.total);

    // Payment recorded + verified.
    const { data: pay } = await admin
      .from("payments")
      .select("status,amount,verified_at")
      .eq("booking_id", bookingId)
      .single();
    expect(pay!.status).toBe("success");
    expect(pay!.amount).toBe(draft.total);
    expect(pay!.verified_at).toBeTruthy();
  });

  it("DB rejects an invalid transition (draft → confirmed)", async () => {    const { data: trek } = await admin.from("treks").select("id").eq("status", "published").limit(1).single();
    const { data: dep } = await admin
      .from("trek_departures")
      .select("id")
      .eq("trek_id", trek!.id)
      .neq("status", "cancelled")
      .limit(1)
      .single();
    const { data: b } = await admin
      .from("bookings")
      .insert({ trek_id: trek!.id, departure_id: dep!.id, status: "draft", adults: 1, children: 0, currency: "INR" })
      .select("id")
      .single();

    const { error } = await admin.from("bookings").update({ status: "confirmed" }).eq("id", b!.id);
    expect(error).not.toBeNull(); // enforce_booking_transition() blocks it

    await admin.from("bookings").delete().eq("id", b!.id);
  });
});

// finalizeAsCurrentUser (book/actions.ts) is link + finalize for a session user
// with no OTP/password step; this exercises that same linkAndFinalize path.
(RUN ? describe : describe.skip)("signed-in finalize (integration, live DB)", () => {
  let admin: SupabaseClient;
  let userId = "";
  let bookingId = "";
  let departureId = "";
  let seatsReserved = 0;

  beforeAll(() => {
    admin = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  });

  afterAll(async () => {
    if (bookingId) {
      await admin.from("payments").delete().eq("booking_id", bookingId);
      await admin.from("bookings").delete().eq("id", bookingId);
    }
    if (departureId && seatsReserved) {
      await admin.rpc("release_departure_seats", { _departure_id: departureId, _seats: seatsReserved });
    }
    if (userId) await admin.auth.admin.deleteUser(userId);
  });

  it("finalize reserves seats for a signed-in user without the auth form", async () => {
    const { data: trek } = await admin.from("treks").select("id").eq("status", "published").not("base_price", "is", null).limit(1).single();
    const { data: dep } = await admin
      .from("trek_departures")
      .select("id,booked_seats")
      .eq("trek_id", trek!.id)
      .neq("status", "cancelled")
      .order("start_date", { ascending: true })
      .limit(1)
      .single();
    departureId = dep!.id;

    const { data: created } = await admin.auth.admin.createUser({ email: `test+signedin${Date.now()}@example.com`, email_confirm: true });
    userId = created!.user!.id;

    const draft = await createDraftBooking(admin, {
      trek_id: trek!.id, departure_id: dep!.id, adults: 2, children: 0,
      contact_name: "Signed In", contact_phone: "9999999999", travellers: [], addons: [],
    });
    bookingId = draft.bookingId;

    // Draft straight to pending_payment, no pending_auth/OTP step in between.
    const finalized = await linkAndFinalize(admin, bookingId, draft.draftToken, userId);
    seatsReserved = 2;
    expect(finalized.status).toBe("pending_payment");

    const { data: b } = await admin.from("bookings").select("status,user_id").eq("id", bookingId).single();
    expect(b!.status).toBe("pending_payment");
    expect(b!.user_id).toBe(userId);

    const { data: depAfter } = await admin.from("trek_departures").select("booked_seats").eq("id", departureId).single();
    expect(depAfter!.booked_seats).toBe(dep!.booked_seats + 2);
  });
});

// Deposit (split) payment: a 'deposit'-kind settle moves the booking to
// deposit_paid (NOT confirmed), part-credits amount_paid, records the balance +
// its due date, and keeps the seats reserved. (Task 6, Review Focus #1.)
(RUN ? describe : describe.skip)("deposit payment (integration, live DB)", () => {
  let admin: SupabaseClient;
  let userId = "";
  let bookingId = "";
  let departureId = "";
  let seatsReserved = 0;
  let trekId = "";
  // Original per-trek deposit config, restored in afterAll so the live row is untouched.
  let origCfg: { deposit_type: string; deposit_value: number; balance_due_offset_days: number } | null = null;
  const email = `test+deposit${Date.now()}@example.com`;

  beforeAll(() => {
    admin = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });
  });

  afterAll(async () => {
    if (bookingId) {
      await admin.from("payments").delete().eq("booking_id", bookingId);
      await admin.from("bookings").delete().eq("id", bookingId);
    }
    if (departureId && seatsReserved) {
      await admin.rpc("release_departure_seats", { _departure_id: departureId, _seats: seatsReserved });
    }
    if (userId) await admin.auth.admin.deleteUser(userId);
    if (trekId && origCfg) await admin.from("treks").update(origCfg).eq("id", trekId);
  });

  it("a deposit payment moves the booking to deposit_paid, not confirmed", async () => {
    const { data: trek } = await admin
      .from("treks")
      .select("id,base_price,deposit_type,deposit_value,balance_due_offset_days")
      .eq("status", "published")
      .not("base_price", "is", null)
      .limit(1)
      .single();
    expect(trek).toBeTruthy();
    trekId = trek!.id;
    origCfg = {
      deposit_type: trek!.deposit_type,
      deposit_value: trek!.deposit_value,
      balance_due_offset_days: trek!.balance_due_offset_days,
    };
    // Make this trek take a 30% deposit with the balance due 2 days before departure.
    await admin.from("treks").update({ deposit_type: "percent", deposit_value: 30, balance_due_offset_days: 2 }).eq("id", trekId);

    const { data: dep } = await admin
      .from("trek_departures")
      .select("id,booked_seats")
      .eq("trek_id", trekId)
      .neq("status", "cancelled")
      .order("start_date", { ascending: true })
      .limit(1)
      .single();
    departureId = dep!.id;

    const { data: created } = await admin.auth.admin.createUser({ email, email_confirm: true });
    userId = created!.user!.id;

    // Draft → pending_auth → finalize (reserve 2 seats, pending_payment).
    const draft = await createDraftBooking(admin, {
      trek_id: trekId, departure_id: departureId, adults: 2, children: 0,
      contact_name: "Deposit Guest", contact_phone: "9999999999", travellers: [], addons: [],
    });
    bookingId = draft.bookingId;
    await admin.from("bookings").update({ status: "pending_auth", contact_email: email }).eq("id", bookingId);
    const finalized = await linkAndFinalize(admin, bookingId, draft.draftToken, userId);
    seatsReserved = 2;
    expect(finalized.status).toBe("pending_payment");

    const grandTotal = finalized.grand_total;
    const deposit = computeDeposit(grandTotal, { type: "percent", value: 30 });
    expect(deposit).toBeGreaterThan(0);
    expect(deposit).toBeLessThan(grandTotal);

    // Charge the deposit slice via the real service path, then settle it like the
    // PhonePe callback does (server-verified amount == the deposit we charged).
    const { merchantTransactionId, amountPaise } = await createPhonePePayment(admin, bookingId, { amount: deposit, kind: "deposit" });
    expect(amountPaise).toBe(deposit);
    const settled = await confirmPhonePePayment(admin, merchantTransactionId, `txn_dep_${Date.now()}`, deposit);
    expect(settled).not.toBeNull();

    // Booking settled to deposit_paid, part-paid, balance recorded — NOT confirmed.
    const { data: b } = await admin
      .from("bookings")
      .select("status,amount_paid,balance_due,balance_due_date,deposit_amount,grand_total")
      .eq("id", bookingId)
      .single();
    expect(b!.status).toBe("deposit_paid");
    expect(b!.status).not.toBe("confirmed");
    expect(b!.amount_paid).toBe(deposit);
    expect(b!.deposit_amount).toBe(deposit);
    expect(b!.balance_due).toBe(grandTotal - deposit);
    expect(b!.balance_due_date).toBeTruthy();

    // Seats stay reserved while the balance is pending.
    const { data: depAfter } = await admin.from("trek_departures").select("booked_seats").eq("id", departureId).single();
    expect(depAfter!.booked_seats).toBe(dep!.booked_seats + 2);

    // Payment row recorded as a successful deposit.
    const { data: pay } = await admin.from("payments").select("status,amount,kind,verified_at").eq("booking_id", bookingId).single();
    expect(pay!.status).toBe("success");
    expect(pay!.amount).toBe(deposit);
    expect(pay!.kind).toBe("deposit");
    expect(pay!.verified_at).toBeTruthy();

    // Idempotent: settling the same deposit again is a no-op, never over-credits.
    const again = await confirmPhonePePayment(admin, merchantTransactionId, `txn_dep_${Date.now()}`, deposit);
    expect(again).not.toBeNull();
    const { data: b2 } = await admin.from("bookings").select("status,amount_paid").eq("id", bookingId).single();
    expect(b2!.status).toBe("deposit_paid");
    expect(b2!.amount_paid).toBe(deposit);
  });
});
