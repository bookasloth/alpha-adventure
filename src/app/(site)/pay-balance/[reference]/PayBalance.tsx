"use client";

import { useEffect, useState } from "react";
import { startBalancePayment, verifyBalancePayment } from "../../book/actions";
import type { CheckoutOrder } from "@/domain/booking/razorpayPayment";
import { noticeText, type PaymentNotice } from "@/domain/booking/paymentNotice";

type PayMode = { provider: "razorpay" | "phonepe" | "mock"; testMode: boolean };
type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RzpInstance = { open: () => void; on: (ev: "payment.failed", cb: (r: { error?: { description?: string } }) => void) => void };
declare global { interface Window { Razorpay?: new (opts: Record<string, unknown>) => RzpInstance } }

// ponytail: duplicate until a third caller appears — the booking flow has its own
// copy (BookingFlow.tsx). Two short copies beat a shared module with one real user.
function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("checkout script failed"));
    document.body.appendChild(s);
  });
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
function fmtDate(d: string | null): string {
  if (!d) return "";
  const dt = new Date(`${d.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return d;
  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${WD[dt.getUTCDay()]} ${dt.getUTCDate()} ${MO[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

export default function PayBalance({
  reference, trekTitle, status, balanceDue, balanceDueDate, payable, payMode, paymentNotice = null,
}: {
  paymentNotice?: PaymentNotice | null;
  reference: string; trekTitle: string; status: string; balanceDue: number;
  balanceDueDate: string | null; payable: boolean; payMode: PayMode;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Back from PhonePe's hosted page can restore this page frozen on "Starting…";
  // mirror Razorpay's ondismiss so it's retryable, never a dead end.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      setBusy(false);
      setError("Payment window closed. Tap Pay balance to try again.");
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  async function pay() {
    setError(null);
    if (!email) return setError("Enter the email on your booking.");
    setBusy(true);
    try {
      const r = await startBalancePayment(reference, email);
      if (r.ok && r.redirectUrl) { window.location.href = r.redirectUrl; return; } // to PhonePe; stay busy
      if (r.ok && r.razorpay) return openRazorpay(r.razorpay); // modal owns busy from here
      setBusy(false);
      if (!r.ok) return setError(r.error);
      setDone(true); // shouldn't happen (balance always routes to a gateway), but be safe
    } catch {
      setBusy(false);
      setError("We couldn't start the payment. Please try again.");
    }
  }

  async function openRazorpay(o: CheckoutOrder) {
    try {
      await loadRazorpay();
    } catch {
      setBusy(false);
      return setError("Couldn't open the payment window. Check your connection and try again.");
    }
    let handled = false;
    const rzp = new window.Razorpay!({
      key: o.keyId,
      order_id: o.orderId,
      amount: o.amount,
      currency: "INR",
      name: "Alpha Adventures",
      description: `${o.trekTitle} · ${o.reference} · balance`,
      prefill: { name: o.name, email: o.email || email },
      notes: { reference: o.reference },
      theme: { color: "#fe5100" },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          if (handled) return;
          setBusy(false);
          setError("Payment window closed. Tap Pay balance to try again.");
        },
      },
      handler: async (resp: RzpResponse) => {
        handled = true;
        setVerifying(true);
        try {
          const v = await verifyBalancePayment(reference, email, resp);
          if (!v.ok) return setError(v.error);
          setDone(true);
        } catch {
          setError("We couldn't confirm your payment yet. If money was taken, your booking will be confirmed by email shortly.");
        } finally {
          setVerifying(false);
          setBusy(false);
        }
      },
    });
    rzp.on("payment.failed", (r) => {
      setError(`Payment failed${r.error?.description ? `: ${r.error.description}` : ""}. You can try again.`);
    });
    rzp.open();
  }

  const card = "mx-auto max-w-md bg-white rounded-2xl shadow-sm border border-[#ece6e1] p-7 my-10";

  if (done)
    return (
      <div className="container-px">
        <div className={card}>
          <h1 className="text-2xl font-bold text-ink mb-3">Balance paid — you&apos;re confirmed!</h1>
          <p className="text-[#6b6460]">Your booking <strong>{reference}</strong> for {trekTitle} is now fully paid and confirmed — we received your balance of <strong>{rupees(balanceDue)}</strong>. A confirmation email is on its way.</p>
        </div>
      </div>
    );

  if (!payable)
    return (
      <div className="container-px">
        <div className={card}>
          <h1 className="text-2xl font-bold text-ink mb-3">Nothing to pay</h1>
          <p className="text-[#6b6460]">
            {status === "confirmed"
              ? "This balance is already paid — your booking is confirmed."
              : "This balance is already paid or not due."}
          </p>
        </div>
      </div>
    );

  return (
    <div className="container-px">
      <div className={card}>
        <h1 className="text-2xl font-bold text-ink mb-1">Pay your balance</h1>
        <p className="text-[#6b6460] mb-5">Complete the remaining payment to confirm your seats.</p>

        <dl className="rounded-xl bg-[#faf7f4] border border-[#ece6e1] p-4 mb-5 text-sm">
          <div className="flex justify-between py-1"><dt className="text-[#6b6460]">Trek</dt><dd className="font-semibold text-ink">{trekTitle}</dd></div>
          <div className="flex justify-between py-1"><dt className="text-[#6b6460]">Reference</dt><dd className="font-semibold text-ink">{reference}</dd></div>
          {balanceDueDate && <div className="flex justify-between py-1"><dt className="text-[#6b6460]">Pay by</dt><dd className="font-semibold text-ink">{fmtDate(balanceDueDate)}</dd></div>}
          <div className="flex justify-between py-2 mt-1 border-t border-[#ece6e1]"><dt className="font-bold text-ink">Balance due</dt><dd className="font-bold text-primary">{rupees(balanceDue)}</dd></div>
        </dl>

        <label className="block text-sm font-medium text-ink mb-1" htmlFor="pb-email">Email on your booking</label>
        <input
          id="pb-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-[#ece6e1] px-3 py-2.5 mb-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <p className="text-xs text-[#6b6460] mb-4">We use this to confirm it&apos;s your booking.</p>

        {paymentNotice && !error && <p className="text-sm text-[#6b6460] mb-3" role="alert">{noticeText(paymentNotice, "balance")}</p>}
        {error && <p className="text-sm text-red-600 mb-3" role="alert">{error}</p>}

        <button
          type="button"
          onClick={pay}
          disabled={busy || verifying}
          className="btn-primary w-full justify-center disabled:opacity-60"
        >
          {verifying ? "Confirming…" : busy ? "Starting…" : `Pay balance ${rupees(balanceDue)}`}
        </button>
        <p className="text-center text-xs text-[#6b6460] mt-3">
          {payMode.testMode ? "Test mode — no real money is charged" : payMode.provider === "razorpay" ? "Secure payment by Razorpay" : "Secure payment"}
        </p>
      </div>
    </div>
  );
}
