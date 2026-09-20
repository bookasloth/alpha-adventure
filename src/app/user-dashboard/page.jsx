import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Dashboard from "./Dashboard";

export const metadata = { title: "My Dashboard" };
export const dynamic = "force-dynamic";

const PAID = new Set(["confirmed", "deposit_paid", "completed"]);

export default async function UserDashboardPage() {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/user-dashboard");

  // RLS scopes both to this user.
  const [{ data: bookings }, { data: profile }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,reference,trek_title,departure_date,status,adults,children,grand_total,created_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  const rows = bookings ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: rows.length,
    upcoming: rows.filter((b) => PAID.has(b.status) && (b.departure_date ?? "") >= today).length,
    spent: rows.filter((b) => PAID.has(b.status)).reduce((s, b) => s + (b.grand_total ?? 0), 0),
  };
  // Payments derived from paid bookings (no separate payments table yet).
  const payments = rows
    .filter((b) => PAID.has(b.status))
    .map((b) => ({ id: b.id, date: b.created_at, reference: b.reference, amount: b.grand_total, status: b.status }));

  return (
    <Dashboard
      email={user.email}
      profile={profile ?? {}}
      bookings={rows}
      payments={payments}
      stats={stats}
    />
  );
}
