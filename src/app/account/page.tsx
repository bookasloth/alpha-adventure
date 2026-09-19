import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "../login/actions";

export const metadata = { title: "My Bookings" };
export const dynamic = "force-dynamic";

const rupees = (paise: number | null) => `₹${((paise ?? 0) / 100).toLocaleString("en-IN")}`;

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_auth: "Awaiting verification",
  pending_payment: "Awaiting payment",
  payment_processing: "Processing payment",
  confirmed: "Confirmed",
  deposit_paid: "Deposit paid",
  completed: "Completed",
  payment_failed: "Payment failed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export default async function AccountPage() {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  // RLS returns only this user's bookings.
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id,reference,trek_title,departure_date,status,adults,children,grand_total,created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="section">
      <div className="container-px" style={{ maxWidth: 820, margin: "0 auto", padding: "40px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 className="section-title" style={{ margin: 0 }}>My Bookings</h1>
          <form action={signOut}>
            <button type="submit" className="text-sm underline">Sign out</button>
          </form>
        </div>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>Signed in as {user.email}</p>

        {!bookings || bookings.length === 0 ? (
          <p>No bookings yet. Browse <a href="/treks/upcoming-treks" className="underline">upcoming treks</a> to book your first adventure.</p>
        ) : (
          <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none", padding: 0 }}>
            {bookings.map((b) => (
              <li key={b.id} className="card" style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong>{b.trek_title ?? "Trek"}</strong>
                    <div style={{ color: "#6b7280", fontSize: 14 }}>
                      {b.departure_date ?? "Date TBC"} · {(b.adults ?? 0) + (b.children ?? 0)} traveller(s)
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Ref: {b.reference}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 600 }}>{rupees(b.grand_total)}</div>
                    <div style={{ fontSize: 13 }}>{STATUS_LABEL[b.status] ?? b.status}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
