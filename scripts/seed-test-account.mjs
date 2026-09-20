// Seeds a test user + a few bookings so the dashboard is populated.
// Login is passwordless: go to /login, enter this email, use the emailed code.
// Usage: node scripts/seed-test-account.mjs [email]
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const email = process.argv[2] || "alphaadventures01@gmail.com";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// 1) Ensure the user (auto-creates its profile via the handle_new_user trigger).
await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
const { data: list } = await admin.auth.admin.listUsers();
const user = list.users.find((u) => u.email === email);
if (!user) { console.error("could not create/find user"); process.exit(1); }
// Fill the profile so the dashboard shows a name (profiles uses first/last_name).
await admin.from("profiles").update({ first_name: "Test", last_name: "Trekker", email, phone: "+91 90000 00000" }).eq("id", user.id);

// 2) Pick a real trek + its departures.
const { data: trek } = await admin.from("treks").select("id,title").eq("status", "published").is("deleted_at", null).limit(1).single();
const { data: deps } = await admin.from("trek_departures").select("id,start_date").eq("trek_id", trek.id).order("start_date").limit(3);
const dep = (i) => deps[i % deps.length];

// 3) Reset previous test bookings, then insert a varied set.
await admin.from("bookings").delete().eq("user_id", user.id).like("reference", "AA-TEST%");
const future = deps.find((d) => d.start_date >= new Date().toISOString().slice(0, 10)) || deps[0];
const rows = [
  { reference: "AA-TEST01", status: "confirmed", adults: 2, children: 0, grand_total: 259800, departure_date: future.start_date, departure_id: future.id, confirmed_at: new Date().toISOString() },
  { reference: "AA-TEST02", status: "pending_payment", adults: 1, children: 0, grand_total: 129900, departure_date: dep(1).start_date, departure_id: dep(1).id },
  { reference: "AA-TEST03", status: "completed", adults: 3, children: 1, grand_total: 389700, departure_date: "2025-08-02", departure_id: dep(2).id },
].map((r) => ({
  ...r, user_id: user.id, trek_id: trek.id, trek_title: trek.title,
  contact_email: email, contact_name: "Test Trekker",
  price_adult: 129900, subtotal: r.grand_total,
}));
const { error } = await admin.from("bookings").insert(rows);
if (error) { console.error("insert failed:", error.message); process.exit(1); }

console.log("Test account ready.");
console.log("  Email :", email, "(user", user.id + ")");
console.log("  Trek  :", trek.title);
console.log("  Bookings:", rows.map((r) => `${r.reference}/${r.status}`).join(", "));
console.log("  Login : /login -> enter the email -> 8-digit code -> dashboard.");
