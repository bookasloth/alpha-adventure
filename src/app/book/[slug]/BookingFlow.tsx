"use client";

import { useMemo, useState } from "react";
import { createDraft, sendBookingOtp, verifyBookingOtp, resendBookingOtp } from "../actions";

type Trek = { id: string; title: string; base_price: number };
type Departure = {
  id: string;
  start_date: string;
  end_date: string | null;
  capacity: number;
  booked_seats: number;
  price_override: number | null;
};
type Addon = { id: string; name: string; price: number };

type Step = "departure" | "details" | "review" | "email" | "otp" | "done";

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

export default function BookingFlow({
  trek,
  departures,
  addons,
}: {
  trek: Trek;
  departures: Departure[];
  addons: Addon[];
}) {
  const [step, setStep] = useState<Step>("departure");
  const [departureId, setDepartureId] = useState<string>("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [bookingId, setBookingId] = useState("");
  const [total, setTotal] = useState(0);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departure = useMemo(() => departures.find((d) => d.id === departureId), [departures, departureId]);
  const seats = adults + children;
  const seatsLeft = departure ? departure.capacity - departure.booked_seats : 0;

  const addonList = () =>
    Object.entries(addonQty)
      .filter(([, q]) => q > 0)
      .map(([addon_id, quantity]) => ({ addon_id, quantity }));

  async function goReview() {
    setError(null);
    if (!departure) return setError("Please select a departure.");
    if (!contactName.trim()) return setError("Please enter a contact name.");
    if (seats < 1) return setError("Add at least one traveller.");
    if (seats > seatsLeft) return setError("Not enough seats left on this departure.");
    setBusy(true);
    const r = await createDraft({
      trek_id: trek.id,
      departure_id: departure.id,
      adults,
      children,
      contact_name: contactName,
      contact_phone: contactPhone,
      travellers: [],
      addons: addonList(),
    });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setBookingId(r.bookingId);
    setTotal(r.total);
    setStep("review");
  }

  async function sendCode() {
    setError(null);
    setBusy(true);
    const r = await sendBookingOtp(bookingId, email);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setStep("otp");
  }

  async function verify() {
    setError(null);
    setBusy(true);
    const r = await verifyBookingOtp(bookingId, email, code);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setReference(r.reference);
    setStep("done");
  }

  if (departures.length === 0 && step === "departure") {
    return <p>No upcoming departures for this trek right now. Please check back soon.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {step === "departure" && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Choose a departure</h2>
          {departures.map((d) => {
            const left = d.capacity - d.booked_seats;
            const price = d.price_override ?? trek.base_price;
            return (
              <label key={d.id} style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
                <input type="radio" name="departure" value={d.id} checked={departureId === d.id} onChange={() => setDepartureId(d.id)} />
                <span style={{ flex: 1 }}>
                  <strong>{d.start_date}</strong>{d.end_date ? ` → ${d.end_date}` : ""}
                  <span style={{ color: left > 0 ? "#16a34a" : "#dc2626", marginLeft: 8, fontSize: 13 }}>
                    {left > 0 ? `${left} seats left` : "Full"}
                  </span>
                </span>
                <span style={{ fontWeight: 600 }}>{rupees(price)}</span>
              </label>
            );
          })}
          <button className="btn-primary" disabled={!departureId} onClick={() => setStep("details")}>Continue</button>
        </div>
      )}

      {step === "details" && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Travellers & details</h2>
          <Counter label="Adults" value={adults} min={1} onChange={setAdults} />
          <Counter label="Children" value={children} min={0} onChange={setChildren} />
          {addons.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-semibold">Add-ons</span>
              {addons.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: 1 }}>{a.name} <span style={{ color: "#6b7280" }}>({rupees(a.price)})</span></span>
                  <Counter label="" value={addonQty[a.id] ?? 0} min={0} onChange={(v) => setAddonQty((s) => ({ ...s, [a.id]: v }))} />
                </div>
              ))}
            </div>
          )}
          <label className="font-semibold" htmlFor="cn">Contact name*</label>
          <input id="cn" className="form-control" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" />
          <label className="font-semibold" htmlFor="cp">Contact phone</label>
          <input id="cp" className="form-control" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Optional" />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="text-sm underline" onClick={() => setStep("departure")}>Back</button>
            <button className="btn-primary" style={{ marginLeft: "auto" }} disabled={busy} onClick={goReview}>
              {busy ? "Pricing…" : "Review booking"}
            </button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Review</h2>
          <p>{trek.title} · {departure?.start_date}</p>
          <p>{adults} adult(s){children ? `, ${children} child(ren)` : ""}</p>
          <p style={{ fontSize: 20, fontWeight: 700 }}>Total: {rupees(total)}</p>
          <p style={{ color: "#6b7280", fontSize: 13 }}>Verify your email to complete the booking.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="text-sm underline" onClick={() => setStep("details")}>Back</button>
            <button className="btn-primary" style={{ marginLeft: "auto" }} onClick={() => setStep("email")}>Complete booking</button>
          </div>
        </div>
      )}

      {step === "email" && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Confirm your email</h2>
          <p style={{ color: "#6b7280", fontSize: 14 }}>We&apos;ll send a one-time code to keep your booking safe. Your account is created automatically.</p>
          <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button className="btn-primary" disabled={busy || !email} onClick={sendCode}>{busy ? "Sending…" : "Send code"}</button>
        </div>
      )}

      {step === "otp" && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold">Enter the code</h2>
          <p>Sent to <strong>{email}</strong>.</p>
          <input className="form-control" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" />
          <button className="btn-primary" disabled={busy || code.length !== 6} onClick={verify}>{busy ? "Verifying…" : "Verify & book"}</button>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="text-sm underline" onClick={() => resendBookingOtp(email)}>Resend code</button>
            <button className="text-sm underline" onClick={() => { setStep("email"); setCode(""); }}>Change email</button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold" style={{ color: "#16a34a" }}>Booking placed 🎉</h2>
          <p>Reference: <strong>{reference}</strong></p>
          <p>Your seats are reserved. <strong>Payment is coming soon</strong> — we&apos;ll email you to complete it.</p>
          <a className="btn-primary" href="/account">View my bookings</a>
        </div>
      )}

      {error && <p role="alert" style={{ color: "#dc2626" }}>{error}</p>}
    </div>
  );
}

function Counter({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {label && <span style={{ flex: 1 }}>{label}</span>}
      <button type="button" aria-label="decrease" onClick={() => onChange(Math.max(min, value - 1))} style={btn}>−</button>
      <span style={{ minWidth: 24, textAlign: "center" }}>{value}</span>
      <button type="button" aria-label="increase" onClick={() => onChange(value + 1)} style={btn}>+</button>
    </div>
  );
}

const btn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: "1px solid #d1d5db", fontSize: 18, lineHeight: 1 };
