"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/admin/data";
import { background } from "@/lib/after";
import { BOOKING_EMAIL_COLS, bookingEmailOf, sendBookingCancelledEmail } from "@/lib/email";

type Result = { ok: true } | { ok: false; error: string };

const rupees = (paise: number | null) => Math.round((paise || 0) / 100);

export type BookingDetail = {
  reference: string;
  status: string;
  trekTitle: string;
  departureDate: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  contact: { name: string | null; email: string | null; phone: string | null };
  adults: number;
  children: number;
  seats: number;
  notes: string | null;
  totals: { priceAdult: number; priceChild: number; addons: number; subtotal: number; grandTotal: number; amountPaid: number; balanceDue: number };
  travellers: { name: string; age: number | null; gender: string | null; isLead: boolean; phone: string | null; email: string | null; emergencyPhone: string | null }[];
  addons: { name: string; unitPrice: number; quantity: number; lineTotal: number }[];
  payments: { method: string | null; kind: string | null; amount: number; status: string; txnId: string | null; when: string }[];
};

// Full booking record for the admin "View booking" detail view. Service-role
// read behind the requireAdmin() gate (same pattern as getAdminData).
export async function getBookingDetail(
  id: string,
): Promise<{ ok: true; detail: BookingDetail } | { ok: false; error: string }> {
  const { admin } = await requireAdmin();
  const [{ data: b, error }, { data: travellers }, { data: addons }, { data: payments }] = await Promise.all([
    admin.from("bookings")
      .select("reference,status,trek_title,departure_date,created_at,confirmed_at,cancelled_at,contact_name,contact_email,contact_phone,adults,children,seats,notes,price_adult,price_child,addons_total,subtotal,grand_total,amount_paid,balance_due")
      .eq("id", id).maybeSingle(),
    admin.from("booking_travellers")
      .select("full_name,age,gender,is_lead,phone,email,emergency_contact_phone,position")
      .eq("booking_id", id).order("position"),
    admin.from("booking_addons").select("name,unit_price,quantity,line_total").eq("booking_id", id),
    admin.from("payments")
      .select("method,kind,amount,status,provider_txn_id,created_at").eq("booking_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (error || !b) { console.error("[getBookingDetail]", error?.message); return { ok: false, error: "Could not load this booking." }; }

  return {
    ok: true,
    detail: {
      reference: b.reference,
      status: b.status,
      trekTitle: b.trek_title ?? "—",
      departureDate: b.departure_date,
      createdAt: b.created_at,
      confirmedAt: b.confirmed_at,
      cancelledAt: b.cancelled_at,
      contact: { name: b.contact_name, email: b.contact_email, phone: b.contact_phone },
      adults: b.adults ?? 0,
      children: b.children ?? 0,
      seats: b.seats ?? 0,
      notes: b.notes,
      totals: {
        priceAdult: rupees(b.price_adult), priceChild: rupees(b.price_child), addons: rupees(b.addons_total),
        subtotal: rupees(b.subtotal), grandTotal: rupees(b.grand_total), amountPaid: rupees(b.amount_paid), balanceDue: rupees(b.balance_due),
      },
      travellers: (travellers ?? []).map((t) => ({
        name: t.full_name, age: t.age, gender: t.gender, isLead: !!t.is_lead,
        phone: t.phone, email: t.email, emergencyPhone: t.emergency_contact_phone,
      })),
      addons: (addons ?? []).map((a) => ({ name: a.name, unitPrice: rupees(a.unit_price), quantity: a.quantity ?? 0, lineTotal: rupees(a.line_total) })),
      payments: (payments ?? []).map((p) => ({
        method: p.method, kind: p.kind, amount: rupees(p.amount), status: p.status, txnId: p.provider_txn_id,
        when: new Date(p.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      })),
    },
  };
}

// Admin-cancel a booking. Does not auto-refund seats/payment — that's a
// separate reconciliation step; this just flags the booking cancelled.
export async function cancelBooking(id: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { data: rows, error } = await admin
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id)
    .neq("status", "cancelled") // never re-notify an already-cancelled booking
    .select(BOOKING_EMAIL_COLS);
  if (error) { console.error("[cancelBooking]", error.message); return { ok: false, error: "Could not cancel the booking." }; }
  const mail = rows?.[0] && bookingEmailOf(rows[0]);
  if (mail) background(sendBookingCancelledEmail(mail, "operator"));
  revalidatePath("/admin");
  revalidatePath("/user-dashboard");
  return { ok: true };
}
