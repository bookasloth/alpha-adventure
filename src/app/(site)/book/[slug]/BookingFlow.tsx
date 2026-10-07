"use client";

import { useMemo, useState } from "react";
import "./booking.css";
import { createDraft, authenticateBooking, startPayment } from "../actions";
import { createClient } from "@/utils/supabase/client";

type Trek = { id: string; title: string; summary: string | null; base_price: number; child_price: number | null; place: string };
type Departure = { id: string; start_date: string; end_date: string | null; capacity: number; booked_seats: number; price_override: number | null };
type Addon = { id: string; name: string; price: number };
type Gender = "male" | "female" | "other" | "prefer_not_to_say";
type Traveller = { full_name: string; age: string; gender: Gender | ""; emergency_contact_phone?: string };
type Pay = "auth" | "pay";

const rupees = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN");
const GENDERS: { v: Gender; label: string }[] = [
  { v: "male", label: "Male" }, { v: "female", label: "Female" }, { v: "other", label: "Other" }, { v: "prefer_not_to_say", label: "Prefer not to say" },
];
const STEPS = [
  { key: "Departure", sub: "Pick a date" },
  { key: "Travellers", sub: "Who's coming?" },
  { key: "Details", sub: "Traveller info" },
  { key: "Extras", sub: "Add-ons" },
  { key: "Pay", sub: "Confirm & pay" },
];
const Arrow = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6}><path d="M9 6l6 6-6 6" /></svg>);
const Chevron = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M15 18l-6-6 6-6" /></svg>);

export default function BookingFlow({ trek, departures, addons }: { trek: Trek; departures: Departure[]; addons: Addon[] }) {
  const [step, setStep] = useState(0);
  const [departureId, setDepartureId] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travellers, setTravellers] = useState<Traveller[]>([{ full_name: "", age: "", gender: "" }]);
  const [tIndex, setTIndex] = useState(0);
  const [addonOn, setAddonOn] = useState<Record<string, boolean>>({});
  const [pay, setPay] = useState<Pay>("auth");
  const [authMode, setAuthMode] = useState<"signin" | "register">("register");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [token, setToken] = useState("");
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [reference, setReference] = useState("");
  const [payToken, setPayToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authTried, setAuthTried] = useState(false);

  const departure = useMemo(() => departures.find((d) => d.id === departureId), [departures, departureId]);
  const pax = adults + children;
  const adultUnit = departure?.price_override ?? trek.base_price;
  const childUnit = trek.child_price ?? adultUnit;
  const addonsTotal = addons.reduce((s, a) => s + (addonOn[a.id] ? a.price * pax : 0), 0);
  const total = serverTotal ?? adults * adultUnit + children * childUnit + addonsTotal;

  function syncTravellers(n: number) {
    setTravellers((prev) => { const next = prev.slice(0, n); while (next.length < n) next.push({ full_name: "", age: "", gender: "" }); return next; });
  }
  function resetDraft() { if (bookingId) { setBookingId(""); setToken(""); setServerTotal(null); } }
  function setPaxCount(k: "adults" | "children", v: number) {
    const val = Math.max(k === "adults" ? 1 : 0, v);
    if (k === "adults") { setAdults(val); syncTravellers(val + children); } else { setChildren(val); syncTravellers(adults + val); }
    resetDraft();
  }
  function go(i: number) { setError(null); if (i <= 3) resetDraft(); setStep(i); }

  async function ensureDraft(): Promise<{ id: string; token: string } | null> {
    if (bookingId) return { id: bookingId, token };
    const r = await createDraft({
      trek_id: trek.id, departure_id: departure!.id, adults, children,
      contact_name: travellers[0]?.full_name || "Guest", contact_phone: travellers[0]?.emergency_contact_phone || "",
      travellers: travellers.map((t, i) => ({ full_name: t.full_name, age: t.age ? Number(t.age) : null, gender: t.gender || null, emergency_contact_phone: i === 0 ? t.emergency_contact_phone || "" : "", is_lead: i === 0 })),
      addons: addons.filter((a) => addonOn[a.id]).map((a) => ({ addon_id: a.id, quantity: pax })),
    });
    if (!r.ok) { setError(r.error); return null; }
    setBookingId(r.bookingId); setToken(r.token); setServerTotal(r.total);
    return { id: r.bookingId, token: r.token };
  }
  async function authenticate() {
    setError(null); setAuthTried(true);
    if (authMode === "register" && name.trim().length < 2) return setError("Enter your name.");
    if (!/.+@.+\..+/.test(email)) return setError("Enter a valid email.");
    if (!password) return setError("Enter your password.");
    if (authMode === "register" && name.trim().length < 2) return setError("Enter your name.");
    setBusy(true);
    const d = await ensureDraft();
    if (!d) return setBusy(false);
    const r = await authenticateBooking(d.id, { name, email, password, mode: authMode }, d.token);
    if (!r.ok) { setBusy(false); return setError(r.error); }
    // Best-effort: establish the browser session so the user is signed in after
    // booking (the pay step itself authorises off the payToken, not the session).
    try { await createClient().auth.signInWithPassword({ email, password }); } catch { /* non-fatal */ }
    setBusy(false);
    setReference(r.reference); setPayToken(r.payToken); setPay("pay");
  }
  async function doPay() {
    setError(null); setBusy(true);
    const r = await startPayment(bookingId, payToken);
    if (r.ok && r.redirectUrl) { window.location.href = r.redirectUrl; return; } // to PhonePe
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setReference(r.reference!); setStep(5); // mock path: confirmed inline
  }

  if (step >= 5)
    return (
      <div className="bk-root"><div className="bk-wrap">
        <div className="bk-card bk-confirm" style={{ maxWidth: 620, margin: "40px auto" }}>
          <div className="bk-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg></div>
          <h2 style={{ margin: "0 0 6px", fontSize: 26 }}>You&apos;re booked! 🎉</h2>
          <p className="bk-desc" style={{ maxWidth: 420, margin: "0 auto 14px" }}>A confirmation is on its way to {email}. See you on the trail.</p>
          <p>Reference <span className="bk-ref">{reference}</span></p>
          <div style={{ maxWidth: 340, margin: "20px auto 0" }}>
            <div className="bk-pl"><span>{trek.title}</span><b>{departure ? label(departure) : ""}</b></div>
            <div className="bk-pl"><span>{pax} traveller(s)</span><b>{rupees(total)} paid</b></div>
          </div>
          <div style={{ marginTop: 24 }}><a className="bk-btn bk-btn-primary" href="/account">View my bookings <Arrow /></a></div>
        </div>
      </div></div>
    );

  const stateOf = (i: number) => (step === i ? "active" : i < step ? "done" : "todo");
  const doneSub = (i: number) => [departure ? shortLabel(departure) : "", `${pax} ${pax > 1 ? "people" : "person"}`, "", ""][i] || "";

  return (
    <div className="bk-root">
      <div className="bk-wrap">
        <div className="bk-deco">Mountains<br />call different.</div>
        <div className="bk-top"><a className="bk-back" href={`/treks/${""}`} onClick={(e) => { e.preventDefault(); history.back(); }}><Chevron /> Back to trek</a></div>
        <div className="bk-brand">
          <span className="bk-ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3 20L9 8l4 7 2-3 6 8z" fill="#fe5100" /><path d="M9 8l4 7-2.4 5H3z" fill="#ff8a4d" /><circle cx="17" cy="6" r="2.2" fill="#FFB52A" /></svg></span>
          <div><h1>{trek.title}</h1>{trek.summary ? <p>{trek.summary}</p> : null}</div>
          <div className="bk-help"><svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth={2}><path d="M4 5h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 7a2 2 0 012-2z" /></svg><span>Need help?<br /><b>+91 8180001597</b></span></div>
        </div>

        <div className="bk-stepper">
          {STEPS.map((s, i) => (
            <div className="bk-node" key={s.key} data-on={stateOf(i)}>
              <div className="bk-circle">{i < step ? "✓" : i + 1}</div>
              <div className="bk-lbl">{s.key}</div>
              <div className="bk-nsub">{i < step && doneSub(i) ? doneSub(i) : s.sub}</div>
            </div>
          ))}
        </div>

        <div className="bk-split">
          <div className="bk-card bk-panel">
            {step === 0 && (
              <Panel eyebrow="Step 1 of 5" title="Choose your departure" desc="Pick the date that works for you. You can change it anytime.">
                {departures.length === 0 && <p>No upcoming departures right now.</p>}
                {departures.map((d) => { const left = d.capacity - d.booked_seats; const sold = left <= 0; return (
                  <button key={d.id} type="button" className="bk-opt" aria-checked={departureId === d.id} disabled={sold} onClick={() => { setDepartureId(d.id); resetDraft(); }}>
                    <span className="bk-radio" />
                    <span className="bk-m"><div className="bk-lead">{label(d)}</div><div className="bk-tiny">Seats {sold ? "sold out" : `available · ${left}`}</div></span>
                    <span style={{ textAlign: "right" }}>{sold ? <div className="bk-full">Sold out</div> : left <= 3 ? <div className="bk-left">Only {left} left</div> : null}<div className="bk-price">{rupees(adultUnit)}<span className="bk-tiny"> /adult</span></div></span>
                  </button>
                ); })}
                <Foot next={departureId ? { label: "Continue", onClick: () => go(1) } : undefined} />
              </Panel>
            )}

            {step === 1 && (
              <Panel eyebrow="Step 2 of 5" title="How many travellers?" desc="Add the number of people joining this trek.">
                <div className="bk-crow"><span className="bk-av a"><PersonIcon /></span>
                  <div className="bk-m"><div className="bk-lead">Adults</div><div className="bk-tiny">Age 13+ · {rupees(adultUnit)} each</div></div>
                  <div className="bk-stepc"><button onClick={() => setPaxCount("adults", adults - 1)}>−</button><span className="bk-n">{adults}</span><button onClick={() => setPaxCount("adults", adults + 1)}>+</button></div></div>
                <div className="bk-crow"><span className="bk-av c"><KidsIcon /></span>
                  <div className="bk-m"><div className="bk-lead">Children</div><div className="bk-tiny">Age 5–12 · {rupees(childUnit)} each</div></div>
                  <div className="bk-stepc"><button onClick={() => setPaxCount("children", children - 1)}>−</button><span className="bk-n">{children}</span><button onClick={() => setPaxCount("children", children + 1)}>+</button></div></div>
                <div className="bk-note"><InfoIcon /> Infants below 5 years can join for free.</div>
                <Foot back={{ onClick: () => go(0) }} next={{ label: "Continue", onClick: () => { setTIndex(0); go(2); } }} />
              </Panel>
            )}

            {step === 2 && (
              <Panel eyebrow="Step 3 of 5" title="Traveller details" desc={tIndex === 0 ? "We'll use the lead trekker's details for updates." : "Just a few details for each trekker."}>
                <div className="bk-tiny" style={{ margin: "-8px 0 16px" }}>Traveller {tIndex + 1} of {pax}{tIndex === 0 ? " · lead trekker" : ""}</div>
                <TravellerForm
                  key={tIndex}
                  value={travellers[tIndex]} isLead={tIndex === 0}
                  onChange={(t) => setTravellers((prev) => prev.map((x, i) => (i === tIndex ? t : x)))}
                  back={{ label: tIndex === 0 ? "Back" : "Previous", onClick: () => { if (tIndex === 0) go(1); else setTIndex(tIndex - 1); } }}
                  next={{ label: tIndex + 1 < pax ? "Save & next" : "Continue", onClick: () => { setError(null); if (tIndex + 1 < pax) setTIndex(tIndex + 1); else { setTIndex(0); go(3); } } }}
                />
              </Panel>
            )}

            {step === 3 && (
              <Panel eyebrow="Step 4 of 5" title="Make it easier" desc="Add transport, gear or meals. Skip if you don't need them.">
                {addons.length === 0 && <p className="bk-tiny">No add-ons for this trek.</p>}
                {addons.map((a) => (
                  <button key={a.id} type="button" className="bk-opt" aria-checked={!!addonOn[a.id]} onClick={() => { setAddonOn((s) => ({ ...s, [a.id]: !s[a.id] })); resetDraft(); }}>
                    <span className="bk-radio sq" /><span className="bk-m"><div className="bk-lead">{a.name}</div><div className="bk-tiny">{rupees(a.price)} / person</div></span><span className="bk-price">{rupees(a.price * pax)}</span>
                  </button>
                ))}
                {addons.length > 0 && <div className="bk-tiny" style={{ marginTop: 4 }}>Optional — priced per traveller (×{pax}).</div>}
                <Foot back={{ onClick: () => go(2) }} next={{ label: "Continue", onClick: () => go(4) }} />
              </Panel>
            )}

            {step === 4 && pay === "auth" && (
              <Panel eyebrow="Step 5 of 5" title={authMode === "register" ? "Create your account" : "Sign in to book"} desc={authMode === "register" ? "Set a password — you'll use it to manage your bookings." : "Welcome back — sign in to confirm your booking."}>
                {authMode === "register" && (<>
                  <label className="bk-fld">Full name <span className="bk-req">*</span></label>
                  <input className={"bk-inp" + (authTried && name.trim().length < 2 ? " err" : "")} aria-invalid={authTried && name.trim().length < 2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  {authTried && name.trim().length < 2 && <span className="bk-fielderr">Please enter your name.</span>}
                </>)}
                <label className="bk-fld">Email address <span className="bk-req">*</span></label>
                <input className={"bk-inp" + (authTried && !/.+@.+\..+/.test(email) ? " err" : "")} aria-invalid={authTried && !/.+@.+\..+/.test(email)} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                {authTried && !/.+@.+\..+/.test(email) && <span className="bk-fielderr">Enter a valid email address.</span>}
                <label className="bk-fld">Password <span className="bk-req">*</span></label>
                <input className={"bk-inp" + (authTried && !password ? " err" : "")} aria-invalid={authTried && !password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={authMode === "register" ? "8+ chars, 1 capital, 1 number, 1 symbol" : "Your password"} />
                {authTried && !password && <span className="bk-fielderr">Enter your password.</span>}
                {authMode === "register" && <div className="bk-tiny" style={{ marginTop: 6 }}>At least 8 characters, one capital, one number, one special character.</div>}
                <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                  <button type="button" className="bk-linkbtn" onClick={() => { setError(null); setAuthMode(authMode === "register" ? "signin" : "register"); }}>
                    {authMode === "register" ? "Already have an account? Sign in" : "New here? Create an account"}
                  </button>
                </div>
                <Foot back={{ onClick: () => go(3) }} next={{ label: busy ? "Please wait…" : (authMode === "register" ? "Create & continue" : "Sign in & continue"), onClick: authenticate, disabled: busy }} />
              </Panel>
            )}
            {step === 4 && pay === "pay" && (
              <Panel eyebrow="Step 5 of 5" title="Confirm & pay" desc="Your seats are held for 30 minutes.">
                <div className="bk-opt" aria-checked="true"><span className="bk-radio" /><span className="bk-m"><div className="bk-lead">PhonePe · UPI · Card</div><div className="bk-tiny">Test mode — no real charge</div></span></div>
                <div className="bk-pfoot"><span /><button className="bk-btn bk-btn-primary" disabled={busy} onClick={doPay}>{busy ? "Processing…" : `Pay ${rupees(total)}`}</button></div>
              </Panel>
            )}

            {error && <p className="bk-err" role="alert">{error}</p>}
          </div>

          <aside className="bk-aside"><div className="bk-card bk-panel bk-book">
            <h3>Your booking</h3><div className="bk-dd">Double-check your details</div>
            <div className="bk-hero"><Hero /></div>
            <div className="bk-bt">{trek.title}</div>
            <div className="bk-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>{departure ? label(departure) : "Select a date"}</div>
            <div className="bk-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></svg>{trek.place}</div>
            <div className="bk-hr" />
            <div className="bk-pl"><span>Adults ({adults})</span><b>{rupees(adults * adultUnit)}</b></div>
            {children > 0 && <div className="bk-pl"><span>Children ({children})</span><b>{rupees(children * childUnit)}</b></div>}
            {addons.filter((a) => addonOn[a.id]).map((a) => <div className="bk-pl" key={a.id}><span>{a.name}</span><b>{rupees(a.price * pax)}</b></div>)}
            <div className="bk-pl"><span>Taxes &amp; fees</span><b>Included</b></div>
            <div className="bk-hr" />
            <div className="bk-total"><span className="bk-t">Total</span><span className="bk-v">{rupees(total)}</span></div>
            <div className="bk-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 6L9 17l-5-5" /></svg>Free cancellation up to 72h before departure.</div>
          </div></aside>
        </div>

        <div className="bk-foot">
          <span><b style={{ color: "var(--bk-ink)" }}>Explore More.</b> Live Wilder.</span>
          <div className="bk-trust">
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z" /></svg>Safe Travel</span>
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0112 0M17 6a3 3 0 010 6M21 20a6 6 0 00-4-5.6" /></svg>Trusted Organisers</span>
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>Secure Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function label(d: Departure) { return d.end_date && d.end_date !== d.start_date ? `${d.start_date} → ${d.end_date}` : d.start_date; }
function shortLabel(d: Departure) { return d.start_date; }

function Panel({ eyebrow, title, desc, children }: { eyebrow: string; title: string; desc: string; children: React.ReactNode }) {
  return (<><div className="bk-eyebrow">{eyebrow}</div><h2>{title}</h2><p className="bk-desc">{desc}</p>{children}</>);
}
function Foot({ back, next }: { back?: { label?: string; onClick: () => void }; next?: { label: string; onClick: () => void; disabled?: boolean } }) {
  return (
    <div className="bk-pfoot">
      {back ? <button className="bk-btn bk-btn-back" onClick={back.onClick}><Chevron /> {back.label ?? "Back"}</button> : <span />}
      {next ? <button className="bk-btn bk-btn-primary" onClick={next.onClick} disabled={next.disabled}>{next.label} <Arrow /></button> : <span />}
    </div>
  );
}
function TravellerForm({ value, isLead, onChange, back, next }: { value: Traveller; isLead: boolean; onChange: (t: Traveller) => void; back: { label: string; onClick: () => void }; next: { label: string; onClick: () => void } }) {
  const [touched, setTouched] = useState(false);
  const nameInvalid = touched && !value.full_name.trim();
  const guardedNext = () => { if (!value.full_name.trim()) { setTouched(true); return; } next.onClick(); };
  return (
    <div>
      <label className="bk-fld">Full name <span className="bk-req">*</span></label>
      <input
        className={"bk-inp" + (nameInvalid ? " err" : "")}
        aria-invalid={nameInvalid}
        value={value.full_name}
        onChange={(e) => onChange({ ...value, full_name: e.target.value })}
        onBlur={() => setTouched(true)}
        placeholder="As on ID"
      />
      {nameInvalid && <span className="bk-fielderr">Please enter this traveller&apos;s full name.</span>}
      <div className="bk-two">
        <div><label className="bk-fld">Age</label><input className="bk-inp" inputMode="numeric" value={value.age} onChange={(e) => onChange({ ...value, age: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="e.g. 28" /></div>
        <div><label className="bk-fld">Gender</label><select className="bk-inp" value={value.gender} onChange={(e) => onChange({ ...value, gender: e.target.value as Gender })}><option value="">Select</option>{GENDERS.map((g) => <option key={g.v} value={g.v}>{g.label}</option>)}</select></div>
      </div>
      {isLead && (<><label className="bk-fld">Emergency contact phone</label><input className="bk-inp" value={value.emergency_contact_phone ?? ""} onChange={(e) => onChange({ ...value, emergency_contact_phone: e.target.value })} placeholder="+91…" /></>)}
      <Foot back={back} next={{ ...next, onClick: guardedNext }} />
    </div>
  );
}
const PersonIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0z" /></svg>);
const KidsIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="8" r="3" /><circle cx="16" cy="9" r="2.4" /><path d="M2 20a6 6 0 0112 0zM13 20a5 5 0 019-3" /></svg>);
const InfoIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /><path d="M12 8v.5M12 11v5" /></svg>);
const Hero = () => (
  <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bksky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd9a8" /><stop offset="1" stopColor="#ffb98a" /></linearGradient>
      <linearGradient id="bkm1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c9a86" /><stop offset="1" stopColor="#4e6b58" /></linearGradient></defs>
    <rect width="400" height="200" fill="url(#bksky)" /><circle cx="300" cy="60" r="30" fill="#fff2d6" />
    <path d="M0 150 L70 80 L120 130 L180 70 L250 140 L320 90 L400 150 V200 H0 Z" fill="url(#bkm1)" />
    <path d="M0 175 L90 120 L160 165 L240 115 L320 170 L400 130 V200 H0Z" fill="#3c5646" />
    <path d="M0 200 L120 165 L250 195 L400 168 V200Z" fill="#2c3f34" />
  </svg>
);
