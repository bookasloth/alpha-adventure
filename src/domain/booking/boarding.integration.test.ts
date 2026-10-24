import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createDraftBooking } from "./service";

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

const PRICE = 80000; // ₹800 per traveller

(RUN ? describe : describe.skip)("createDraftBooking boarding (integration, live DB)", () => {
  let admin: SupabaseClient;
  const bookingIds: string[] = [];
  const boardingIds: string[] = [];
  let ownId = "";
  let foreignId = "";
  let base: Record<string, unknown>;

  beforeAll(async () => {
    admin = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });

    // A trek that has a bookable departure, plus any OTHER published trek (the "foreign" one).
    const { data: treks } = await admin.from("treks").select("id").eq("status", "published").is("deleted_at", null).not("base_price", "is", null).limit(20);
    let trekId = "";
    let depId = "";
    for (const t of treks ?? []) {
      const { data: dep } = await admin.from("trek_departures").select("id").eq("trek_id", t.id).neq("status", "cancelled")
        .gte("start_date", new Date().toISOString().slice(0, 10)).order("start_date", { ascending: true }).limit(1).maybeSingle();
      if (dep) { trekId = t.id; depId = dep.id; break; }
    }
    expect(trekId).not.toBe("");
    const otherId = (treks ?? []).find((t) => t.id !== trekId)?.id;
    expect(otherId).toBeTruthy();

    const { data: rows, error } = await admin
      .from("trek_boarding_locations")
      .insert([
        { trek_id: trekId, name: "TEST own boarding", subtext: "test", price: PRICE, position: 0 },
        { trek_id: otherId, name: "TEST foreign boarding", subtext: "test", price: 1, position: 0 },
      ])
      .select("id,trek_id");
    expect(error).toBeNull();
    for (const r of rows!) {
      boardingIds.push(r.id);
      if (r.trek_id === trekId) ownId = r.id; else foreignId = r.id;
    }
    base = { trek_id: trekId, departure_id: depId, adults: 2, children: 1, contact_name: "Test Guest", travellers: [], addons: [] };
  });

  afterAll(async () => {
    // Self-cleaning: drafts reserve no seats, so removing the rows is enough.
    if (bookingIds.length) await admin.from("bookings").delete().in("id", bookingIds);
    if (boardingIds.length) await admin.from("trek_boarding_locations").delete().in("id", boardingIds);
  });

  it("prices a valid boarding id from the catalog (per traveller)", async () => {
    const without = await createDraftBooking(admin, base);
    bookingIds.push(without.bookingId);
    const withB = await createDraftBooking(admin, { ...base, boarding_location_id: ownId });
    bookingIds.push(withB.bookingId);
    expect(withB.total).toBe(without.total + PRICE * 3); // 2 adults + 1 child
    const { data: row } = await admin.from("bookings").select("boarding_location_id,boarding_total").eq("id", withB.bookingId).single();
    expect(row!.boarding_location_id).toBe(ownId);
    expect(Number(row!.boarding_total)).toBe(PRICE * 3);
  });

  it("rejects a boarding id belonging to another trek, or an unknown id (tampered)", async () => {
    await expect(createDraftBooking(admin, { ...base, boarding_location_id: foreignId })).rejects.toThrow(/invalid boarding/i);
    await expect(createDraftBooking(admin, { ...base, boarding_location_id: crypto.randomUUID() })).rejects.toThrow(/invalid boarding/i);
  });

  it("price_booking itself rejects a foreign boarding id (service check bypassed)", async () => {
    const { error } = await admin.rpc("price_booking", {
      _trek_id: base.trek_id, _departure_id: base.departure_id, _adults: 1, _children: 0, _addons: [], _boarding_id: foreignId,
    });
    expect(error?.message).toMatch(/invalid boarding/);
  });
});
