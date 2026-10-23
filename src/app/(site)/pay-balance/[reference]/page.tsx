import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { paymentProvider } from "@/lib/payment/provider";
import { razorpayKeyId } from "@/lib/payment/razorpay";
import PayBalance from "./PayBalance";
import { parseNotice } from "@/domain/booking/paymentNotice";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  // Off-session capability link — never index it.
  return { title: "Pay your balance | Alpha Adventures", robots: { index: false } };
}

// Off-session balance-payment page reached from the deposit/reminder emails. The
// reference is the capability to view the summary; the email field at the pay
// step confirms identity before any charge (see startBalancePayment).
export default async function PayBalancePage(props: { params: Promise<{ reference: string }>; searchParams: Promise<{ payment?: string }> }) {
  const { reference } = await props.params;
  const { payment } = await props.searchParams; // set by the PhonePe callback on a closed/failed payment
  const admin = createAdminClient();
  const { data: b } = await admin
    .from("bookings")
    .select("reference,status,trek_title,balance_due,balance_due_date")
    .eq("reference", reference)
    .maybeSingle();
  if (!b) notFound();

  const provider = paymentProvider();
  return (
    <PayBalance
      reference={b.reference}
      trekTitle={b.trek_title ?? "your trek"}
      status={b.status}
      balanceDue={b.balance_due ?? 0}
      balanceDueDate={b.balance_due_date}
      paymentNotice={parseNotice(payment)}
      payable={b.status === "deposit_paid" && (b.balance_due ?? 0) > 0}
      payMode={{ provider, testMode: provider === "mock" || (provider === "razorpay" && razorpayKeyId().startsWith("rzp_test_")) }}
    />
  );
}
