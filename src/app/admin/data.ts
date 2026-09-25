import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Statuses that count as money in (mirrors user-dashboard).
const PAID = new Set(["confirmed", "deposit_paid", "completed"]);
const rupees = (paise: number) => Math.round((paise || 0) / 100);

export type AdminData = Awaited<ReturnType<typeof getAdminData>>;

// Gate: must be signed in AND hold an admin/staff role. Uses the service-role
// client for the role lookup so it can't be spoofed by a missing RLS policy;
// everything downstream is then read with service role behind this gate.
// Exported so admin write actions (e.g. create trek) reuse the same gate.
export async function requireAdmin() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const admin = createAdminClient();
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const ok = (roles ?? []).some((r) => r.role === "admin" || r.role === "staff");
  if (!ok) redirect("/"); // signed in but not staff — bounce home
  return { user, admin };
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export async function getAdminData() {
  const { admin } = await requireAdmin();

  const [bookingsRes, leadsRes, paymentsRes, profilesRes, departuresRes, treksRes, toursRes] = await Promise.all([
    admin.from("bookings")
      .select("id,reference,contact_name,contact_email,user_id,trek_title,departure_date,seats,grand_total,status,created_at")
      .order("created_at", { ascending: false }),
    admin.from("leads")
      .select("id,name,email,subject,status,created_at")
      .order("created_at", { ascending: false }).limit(200),
    admin.from("payments")
      .select("id,booking_id,method,amount,status,created_at,provider_txn_id")
      .order("created_at", { ascending: false }).limit(200),
    admin.from("profiles")
      .select("id,first_name,last_name,email,created_at"),
    admin.from("trek_departures")
      .select("id,trek_id,start_date,end_date,capacity,booked_seats,status,treks(title)")
      .order("start_date", { ascending: true }).limit(200),
    admin.from("treks")
      .select("id,slug,title,group,difficulty,base_price,status,featured").is("deleted_at", null).order("title"),
    admin.from("tours")
      .select("slug,title,type,duration,base_price,status,featured").is("deleted_at", null).order("sort").order("title"),
  ]);

  const bookings = bookingsRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const departures = departuresRes.data ?? [];
  const treksData = (treksRes.data ?? []) as {
    id: string; slug: string; title: string; group: string | null;
    difficulty: string | null; base_price: number | null; status: string; featured: boolean;
  }[];
  const trekOptions = treksData.map((t) => ({ id: t.id, title: t.title }));
  const trekRows = treksData.map((t) => ({
    slug: t.slug,
    title: t.title,
    group: t.group ?? "—",
    difficulty: t.difficulty ?? "—",
    price: rupees(t.base_price ?? 0),
    status: t.status,
    featured: !!t.featured,
  }));
  const tourRows = (toursRes.data ?? []).map((t) => ({
    slug: t.slug,
    title: t.title,
    type: t.type ?? "—",
    duration: t.duration ?? "—",
    price: rupees(t.base_price ?? 0),
    status: t.status,
    featured: !!t.featured,
  }));

  // Booking ref by id, for the payments table.
  const refById = new Map(bookings.map((b) => [b.id, b.reference]));

  // ── table rows (shaped exactly as the UI renders) ─────────────────────────
  const bookingRows = bookings.map((b) => ({
    ref: b.reference,
    customer: b.contact_name || b.contact_email || "Guest",
    trek: b.trek_title ?? "—",
    date: fmtDate(b.departure_date),
    pax: b.seats ?? 0,
    amount: rupees(b.grand_total),
    status: b.status,
  }));

  const leadRows = leads.map((l) => ({
    name: l.name,
    email: l.email,
    subject: l.subject || "—",
    when: ago(l.created_at),
    status: l.status,
  }));

  const paymentRows = payments.map((p) => ({
    id: p.provider_txn_id || p.id.slice(0, 8),
    ref: refById.get(p.booking_id) ?? "—",
    method: p.method || "—",
    amount: rupees(p.amount),
    when: fmtDate(p.created_at),
    status: p.status,
  }));

  const departureRows = departures.map((d) => ({
    trek: (d.treks as { title?: string } | null)?.title ?? "—",
    start: fmtDate(d.start_date),
    end: fmtDate(d.end_date),
    capacity: d.capacity,
    booked: d.booked_seats,
    status: d.status,
  }));

  // Customers: profile + their booking rollup.
  const byUser = new Map<string, { count: number; spent: number }>();
  for (const b of bookings) {
    if (!b.user_id) continue;
    const cur = byUser.get(b.user_id) ?? { count: 0, spent: 0 };
    cur.count += 1;
    if (PAID.has(b.status)) cur.spent += b.grand_total || 0;
    byUser.set(b.user_id, cur);
  }
  const customerRows = profiles
    .map((p) => {
      const roll = byUser.get(p.id) ?? { count: 0, spent: 0 };
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || (p.email ?? "—");
      return {
        name,
        email: p.email ?? "—",
        bookings: roll.count,
        spent: rupees(roll.spent),
        joined: fmtDate(p.created_at),
      };
    })
    .sort((a, b) => b.spent - a.spent);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const now = new Date();
  const monthKey = (iso: string) => new Date(iso).toISOString().slice(0, 7);
  const thisMonth = now.toISOString().slice(0, 7);
  const todayStr = now.toISOString().slice(0, 10);

  const revenueMonth = rupees(
    bookings
      .filter((b) => PAID.has(b.status) && monthKey(b.created_at) === thisMonth)
      .reduce((s, b) => s + (b.grand_total || 0), 0),
  );
  const upcomingDepartures = departures.filter(
    (d) => d.start_date >= todayStr && d.status !== "cancelled",
  ).length;
  const newCustomers = profiles.filter((p) => monthKey(p.created_at) === thisMonth).length;

  const kpis = {
    revenueMonth,
    bookings: bookings.length,
    upcomingDepartures,
    newCustomers,
  };

  // ── chart series ────────────────────────────────────────────────────────
  // Revenue, last 6 months (paid bookings).
  const months: { key: string; m: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: d.toISOString().slice(0, 7), m: d.toLocaleDateString("en-IN", { month: "short" }) });
  }
  const revenueSeries = months.map(({ key, m }) => ({
    m,
    revenue: rupees(
      bookings
        .filter((b) => PAID.has(b.status) && monthKey(b.created_at) === key)
        .reduce((s, b) => s + (b.grand_total || 0), 0),
    ),
  }));

  // Bookings by status (donut buckets).
  const bucket = { Confirmed: 0, Pending: 0, Completed: 0, Cancelled: 0 };
  for (const b of bookings) {
    if (b.status === "confirmed" || b.status === "deposit_paid") bucket.Confirmed++;
    else if (b.status === "completed") bucket.Completed++;
    else if (b.status === "cancelled") bucket.Cancelled++;
    else bucket.Pending++; // draft, pending_auth, pending_payment
  }
  const statusSeries = Object.entries(bucket).map(([name, value]) => ({ name, value }));

  // Top treks by booking count.
  const trekCount = new Map<string, number>();
  for (const b of bookings) {
    const t = b.trek_title ?? "—";
    trekCount.set(t, (trekCount.get(t) ?? 0) + 1);
  }
  const topTreks = [...trekCount.entries()]
    .map(([trek, bookings]) => ({ trek, bookings }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  return {
    kpis,
    bookingRows,
    leadRows,
    paymentRows,
    departureRows,
    customerRows,
    trekOptions,
    trekRows,
    tourRows,
    charts: { revenue: revenueSeries, status: statusSeries, topTreks },
  };
}
