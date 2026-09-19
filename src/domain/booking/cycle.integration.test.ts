import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createDraftBooking, linkAndFinalize, confirmMockPayment } from "./service";

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
      .select("id,base_price")
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
    expect(draft.total).toBe(trek!.base_price * 3); // authoritative server price

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

  it("DB rejects an invalid transition (draft → confirmed)", async () => {
    const { data: trek } = await admin.from("treks").select("id").eq("status", "published").limit(1).single();
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
