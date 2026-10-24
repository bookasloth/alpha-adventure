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

(RUN ? describe : describe.skip)("createDraftBooking account_manager_id (integration, live DB)", () => {
  let admin: SupabaseClient;
  const bookingIds: string[] = [];
  const memberIds: string[] = [];
  let activeId = "";
  let inactiveId = "";
  let base: Record<string, unknown>;

  beforeAll(async () => {
    admin = createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: members, error } = await admin
      .from("team_members")
      .insert([
        { name: "TEST active manager", active: true },
        { name: "TEST inactive manager", active: false },
      ])
      .select("id,active");
    expect(error).toBeNull();
    for (const m of members!) {
      memberIds.push(m.id);
      if (m.active) activeId = m.id; else inactiveId = m.id;
    }

    // Pick a genuinely bookable departure (future IST, non-cancelled, on a published
    // trek with a price) — createDraftBooking rejects a past/absent one. Drafts reserve
    // no seats, so free capacity is not required here.
    const istToday = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
    const { data: deps } = await admin
      .from("trek_departures")
      .select("id,trek_id,treks!inner(status,base_price,deleted_at)")
      .eq("treks.status", "published")
      .not("treks.base_price", "is", null)
      .is("treks.deleted_at", null)
      .neq("status", "cancelled")
      .gte("start_date", istToday)
      .order("start_date", { ascending: true })
      .limit(1);
    const d0 = (deps ?? [])[0] as { id: string; trek_id: string } | undefined;
    if (!d0) throw new Error("No future-bookable departure in the live DB — seed one to run this suite.");
    base = { trek_id: d0.trek_id, departure_id: d0.id, adults: 1, children: 0, contact_name: "Test Guest", travellers: [], addons: [] };
  });

  afterAll(async () => {
    // Self-cleaning: drafts reserve no seats, so removing the rows is enough.
    if (bookingIds.length) await admin.from("bookings").delete().in("id", bookingIds);
    if (memberIds.length) await admin.from("team_members").delete().in("id", memberIds);
  });

  async function managerOf(raw: Record<string, unknown>) {
    const d = await createDraftBooking(admin, raw);
    bookingIds.push(d.bookingId);
    const { data } = await admin.from("bookings").select("account_manager_id").eq("id", d.bookingId).single();
    return data!.account_manager_id as string | null;
  }

  it("stores an active member's id", async () => {
    expect(await managerOf({ ...base, account_manager_id: activeId })).toBe(activeId);
  });

  it("stores null for an inactive member, an unknown uuid, or none", async () => {
    expect(await managerOf({ ...base, account_manager_id: inactiveId })).toBeNull();
    expect(await managerOf({ ...base, account_manager_id: crypto.randomUUID() })).toBeNull();
    expect(await managerOf({ ...base, account_manager_id: null })).toBeNull();
    expect(await managerOf(base)).toBeNull();
  });
});
