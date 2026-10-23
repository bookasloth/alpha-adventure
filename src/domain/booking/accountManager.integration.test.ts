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

    const { data: trek } = await admin.from("treks").select("id").eq("status", "published").not("base_price", "is", null).limit(1).single();
    const { data: dep } = await admin.from("trek_departures").select("id").eq("trek_id", trek!.id).neq("status", "cancelled").order("start_date", { ascending: true }).limit(1).single();
    base = { trek_id: trek!.id, departure_id: dep!.id, adults: 1, children: 0, contact_name: "Test Guest", travellers: [], addons: [] };
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
