import { escapeHtml } from "./html";
import { site } from "../data/site";

// Every transactional email, rendered as { subject, html, text }. Pure (no
// sending, no env reads beyond the base URL passed in) so templates are
// unit-testable and previewable at /admin/emails. Senders live in email.ts.
//
// Design: one shared layout (logo header on an orange rule, white card, warm
// footer with phone/WhatsApp/email). Table-based + inline styles because that's
// what Gmail/Outlook/Apple Mail render consistently. Every value that came from
// a customer, the catalog or the DB goes through esc().

export type Rendered = { subject: string; html: string; text: string };

export type BookingEmail = {
  to: string;
  reference: string;
  trekTitle: string;
  departureDate: string | null; // plain YYYY-MM-DD
  seats: number;
  total: number; // paise
  // Optional receipt line items (confirm/finalize rows carry them).
  adults?: number;
  children?: number;
  priceAdult?: number;
  priceChild?: number;
  addonsTotal?: number;
  // Optional departure logistics (trek_departures).
  startTime?: string | null;
  meetingPoint?: string | null;
  trekSlug?: string | null;
};

export type LeadEmail = {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
};

export type DepartureChange =
  | { kind: "moved"; oldDate: string | null; newDate: string | null }
  | { kind: "cancelled" };

/* ───────────────────────────── helpers ───────────────────────────── */

const C = {
  brand: "#fe5100",
  ink: "#110f0f",
  muted: "#6b6460",
  line: "#ece6e1",
  page: "#f4f1ee",
  soft: "#faf7f4",
  tint: "#fff3ec",
};
const FONT = "Poppins,'Segoe UI',Helvetica,Arial,sans-serif";

const esc = (s: string | null | undefined) => escapeHtml(s ?? "");
export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

// "2026-11-14" -> "Sat 14 Nov 2026". Plain dates are calendar days, so format
// in UTC to avoid an off-by-one from the server's timezone.
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  const dt = new Date(`${d.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return d;
  // Hand-built: Intl output (commas etc.) differs between Node/ICU versions.
  const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${WD[dt.getUTCDay()]} ${dt.getUTCDate()} ${MO[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}
// "06:30:00" -> "6:30 am"
function fmtTime(t: string | null | undefined): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return t;
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

const p = (html: string) => `<p style="margin:0 0 16px">${html}</p>`;

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 22px"><tr>
<td style="border-radius:10px;background:${C.brand}"><a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">${esc(label)}</a></td>
</tr></table>`;
}

// Label/value card, e.g. Reference / Date / Travellers. Values are pre-escaped HTML.
function details(rows: [string, string][]): string {
  const body = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr>
<td style="padding:7px 0;color:${C.muted};font-size:14px;width:42%;vertical-align:top">${esc(k)}</td>
<td style="padding:7px 0;font-size:14px;font-weight:600;color:${C.ink};vertical-align:top">${v}</td></tr>`)
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.soft};border:1px solid ${C.line};border-radius:12px;margin:4px 0 20px"><tr><td style="padding:12px 18px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table></td></tr></table>`;
}

function note(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr>
<td style="background:${C.tint};border-left:3px solid ${C.brand};padding:12px 16px;font-size:14px;line-height:1.55;color:${C.ink}">${html}</td></tr></table>`;
}

function list(items: string[]): string {
  return `<ul style="margin:0 0 18px;padding-left:20px">${items.map((i) => `<li style="margin:0 0 6px">${i}</li>`).join("")}</ul>`;
}

const h2 = (t: string) => `<h2 style="font-size:16px;margin:6px 0 10px;color:${C.ink}">${esc(t)}</h2>`;

// HTML -> readable plain text for the multipart text/plain part.
export function htmlToText(html: string): string {
  return html
    .replace(/>\s+</g, "><") // source formatting between tags isn't content
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<div style="display:none[\s\S]*?<\/div>/i, "") // preheader
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const l = label.replace(/<[^>]+>/g, "").trim();
      return l && l !== href ? `${l} (${href})` : href;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(p|h1|h2|h3|tr|li|ul|table)>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#8203;|&zwnj;/g, " ")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type LayoutOpts = { base: string; subject: string; preheader: string; heading: string; body: string; audience?: "customer" | "operator" };

function layout({ base, subject, preheader, heading, body, audience = "customer" }: LayoutOpts): Rendered {
  const footer = audience === "customer"
    ? `Questions? Call or WhatsApp <a href="${esc(site.whatsapp)}" style="color:${C.ink};font-weight:600;text-decoration:none">${esc(site.phone)}</a>
or email <a href="mailto:${esc(site.email)}" style="color:${C.ink};font-weight:600;text-decoration:none">${esc(site.email)}</a>.<br/>
You can also just reply to this email.`
    : `Operator alert from your website. Manage bookings and enquiries in the <a href="${esc(base)}/admin" style="color:${C.ink};font-weight:600">admin panel</a>.`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}${"&nbsp;&zwnj;".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="padding:20px 28px;border-bottom:3px solid ${C.brand}">
<a href="${esc(base)}" style="text-decoration:none"><img src="${esc(base)}/assets/img/logo/logo.png" width="124" height="47" alt="Alpha Adventures" style="display:block;border:0;font-family:${FONT};font-size:18px;font-weight:700;color:${C.brand}"/></a>
</td></tr>
<tr><td style="padding:28px 28px 8px;font-family:${FONT};font-size:15px;line-height:1.65;color:${C.ink}">
<h1 style="font-size:23px;line-height:1.3;margin:0 0 14px;color:${C.ink}">${esc(heading)}</h1>
${body}
</td></tr>
<tr><td style="padding:18px 28px 22px;background:${C.soft};border-top:1px solid ${C.line};font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted}">
${footer}<br/><br/>
<strong style="color:${C.ink}">Alpha Adventures</strong> · ${esc(site.location)} · <a href="${esc(base)}" style="color:${C.muted}">${esc(base.replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text: htmlToText(`<h1>${esc(heading)}</h1>${body}<p>${footer}</p><p>Alpha Adventures · ${esc(site.location)} · ${esc(base)}</p>`) };
}

function bookingRows(b: BookingEmail): [string, string][] {
  return [
    ["Trek", esc(b.trekTitle)],
    ["Date", esc(fmtDate(b.departureDate))],
    ["Reference", esc(b.reference)],
    ["Travellers", String(b.seats)],
  ];
}

/* ─────────────────────────── account emails ─────────────────────────── */

export function verifyEmail(base: string, link: string): Rendered {
  return layout({
    base, subject: "Confirm your email address", preheader: "One tap to confirm this is your email.",
    heading: "Confirm your email",
    body: p("Thanks for joining Alpha Adventures. Tap the button below to confirm this is your email address.")
      + button("Confirm my email", link)
      + p(`<span style="color:${C.muted};font-size:13px">If you didn't create an account, you can ignore this email.</span>`),
  });
}

export function resetPassword(base: string, link: string): Rendered {
  return layout({
    base, subject: "Reset your Alpha Adventures password", preheader: "This link works for the next hour.",
    heading: "Reset your password",
    body: p("We received a request to reset your password. Tap below to choose a new one. The link works for the next hour.")
      + button("Choose a new password", link)
      + p(`<span style="color:${C.muted};font-size:13px">Didn't ask for this? Ignore this email and your password stays the same.</span>`),
  });
}

/* ─────────────────────────── booking emails ─────────────────────────── */

export function bookingPending(base: string, b: BookingEmail): Rendered {
  return layout({
    base, subject: `Your spot is on hold: ${b.trekTitle} (${b.reference})`,
    preheader: `Seats held for ${b.trekTitle}. Complete payment to confirm.`,
    heading: "Your spot is on hold",
    body: p(`We've held ${b.seats === 1 ? "a seat" : `${b.seats} seats`} for you on <strong>${esc(b.trekTitle)}</strong>. Complete payment within 30 minutes to confirm your booking.`)
      + details([...bookingRows(b), ["Amount due", rupees(b.total)]])
      + button("View my booking", `${base}/user-dashboard`)
      + p(`<span style="color:${C.muted};font-size:13px">If the hold runs out, the seats are released and you can book again from the trek page.</span>`),
  });
}

function receiptRow(label: string, qty: number, unit: number): string {
  if (!qty) return "";
  return `<tr><td style="padding:6px 0;color:${C.muted};font-size:14px">${label} (${qty} × ${rupees(unit)})</td>
<td style="padding:6px 0;text-align:right;font-size:14px;font-weight:600">${rupees(qty * unit)}</td></tr>`;
}

export function bookingConfirmed(base: string, b: BookingEmail): Rendered {
  const hasItems = b.priceAdult != null && b.adults != null;
  const receipt = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px">
${hasItems ? receiptRow("Adults", b.adults ?? 0, b.priceAdult ?? 0) + receiptRow("Children", b.children ?? 0, b.priceChild ?? 0) : ""}
${b.addonsTotal ? `<tr><td style="padding:6px 0;color:${C.muted};font-size:14px">Add-ons</td><td style="padding:6px 0;text-align:right;font-size:14px;font-weight:600">${rupees(b.addonsTotal)}</td></tr>` : ""}
<tr><td style="padding:10px 0 0;border-top:1px solid ${C.line};font-weight:700">Total paid</td>
<td style="padding:10px 0 0;border-top:1px solid ${C.line};text-align:right;font-weight:700">${rupees(b.total)}</td></tr></table>`;
  return layout({
    base, subject: `Booking confirmed: ${b.trekTitle} on ${fmtDate(b.departureDate) || "your date"}`,
    preheader: `You're going on ${b.trekTitle}. Reference ${b.reference}.`,
    heading: "You're booked!",
    body: p(`Your place on <strong>${esc(b.trekTitle)}</strong> is confirmed. Keep this email as your receipt.`)
      + details(bookingRows(b))
      + h2("Receipt") + receipt
      + h2("What happens next")
      + list([
        "We'll email you a checklist two days before the trek.",
        "Your trip leader will add you to the group on WhatsApp with pickup details.",
        `Start packing with our <a href="${esc(base)}/guides/packing-checklist" style="color:${C.brand}">packing checklist</a>.`,
      ])
      + button("View my booking", `${base}/user-dashboard`),
  });
}

export function bookingReminder(base: string, b: BookingEmail): Rendered {
  const when = [fmtDate(b.departureDate), fmtTime(b.startTime)].filter(Boolean).join(" at ");
  return layout({
    base, subject: `${b.trekTitle} is on ${fmtDate(b.departureDate) || "its way"}: your checklist`,
    preheader: "Your trek is almost here. Here's what to bring and when to arrive.",
    heading: "Your trek is almost here",
    body: p(`Get ready for <strong>${esc(b.trekTitle)}</strong>. Here's everything you need for the day.`)
      + details([
        ["Trek", esc(b.trekTitle)],
        ["Starts", esc(when)],
        ["Meeting point", b.meetingPoint ? esc(b.meetingPoint) : "Shared by your trip leader on WhatsApp"],
        ["Reference", esc(b.reference)],
        ["Travellers", String(b.seats)],
      ])
      + h2("Before you leave")
      + list([
        "Carry a government photo ID for every traveller.",
        "Reach the meeting point 15 minutes early. The group leaves on time.",
        "Wear trekking shoes with good grip, and carry 2 litres of water, a raincoat or poncho, and some snacks.",
        "Keep your phone charged and save our number for the day.",
        `Check the full <a href="${esc(base)}/guides/packing-checklist" style="color:${C.brand}">packing checklist</a>.`,
      ])
      + note(`Running late or need help on the day? Call or WhatsApp <strong>${esc(site.phone)}</strong>.`),
  });
}

export function bookingCancelled(base: string, b: BookingEmail, by: "customer" | "operator"): Rendered {
  return layout({
    base, subject: `Booking cancelled: ${b.trekTitle} (${b.reference})`,
    preheader: `Booking ${b.reference} has been cancelled.`,
    heading: "Your booking is cancelled",
    body: p(by === "customer"
      ? `As requested, we've cancelled your booking for <strong>${esc(b.trekTitle)}</strong>.`
      : `Your booking for <strong>${esc(b.trekTitle)}</strong> has been cancelled by our team.`)
      + details(bookingRows(b))
      + p(`Any refund is handled under our <a href="${esc(base)}/cancellation-policy" style="color:${C.brand}">cancellation policy</a>. Our team will be in touch if anything is due back to you.`)
      + button("Find another trek", `${base}/treks`),
  });
}

export function holdExpired(base: string, b: BookingEmail): Rendered {
  const again = b.trekSlug ? `${base}/book/${encodeURIComponent(b.trekSlug)}` : `${base}/treks`;
  return layout({
    base, subject: `Your hold on ${b.trekTitle} has ended`,
    preheader: "Payment wasn't completed, so the seats were released. You can book again anytime.",
    heading: "Your hold has ended",
    body: p(`We held seats for you on <strong>${esc(b.trekTitle)}</strong>, but payment wasn't completed in time, so they've been released for other trekkers. You haven't been charged.`)
      + details(bookingRows(b))
      + p("Still keen? Seats may still be available.")
      + button("Book again", again),
  });
}

export function departureChanged(base: string, b: BookingEmail, change: DepartureChange): Rendered {
  if (change.kind === "cancelled") {
    return layout({
      base, subject: `${b.trekTitle} on ${fmtDate(b.departureDate)} has been cancelled`,
      preheader: "We've had to cancel this departure. We'll help you pick another date or arrange a refund.",
      heading: "This departure is cancelled",
      body: p(`We're sorry. We've had to cancel the <strong>${esc(b.trekTitle)}</strong> departure on <strong>${esc(fmtDate(b.departureDate))}</strong>.`)
        + details(bookingRows(b))
        + p(`Our team will contact you to move you to another date or arrange a refund under our <a href="${esc(base)}/cancellation-policy" style="color:${C.brand}">cancellation policy</a>.`)
        + note(`Prefer to sort it now? Call or WhatsApp <strong>${esc(site.phone)}</strong>.`),
    });
  }
  return layout({
    base, subject: `Date change for ${b.trekTitle} (${b.reference})`,
    preheader: `Your trek now starts on ${fmtDate(change.newDate)}.`,
    heading: "Your trek date has changed",
    body: p(`The <strong>${esc(b.trekTitle)}</strong> departure you're booked on has moved.`)
      + details([
        ["Was", `<span style="text-decoration:line-through;color:${C.muted}">${esc(fmtDate(change.oldDate))}</span>`],
        ["Now", esc(fmtDate(change.newDate))],
        ["Reference", esc(b.reference)],
        ["Travellers", String(b.seats)],
      ])
      + p(`If the new date doesn't work for you, call or WhatsApp <strong>${esc(site.phone)}</strong> and we'll help you change or cancel.`)
      + button("View my booking", `${base}/user-dashboard`),
  });
}

export function reviewRequest(base: string, b: BookingEmail): Rendered {
  return layout({
    base, subject: `How was ${b.trekTitle}?`,
    preheader: "We'd love to hear about your trek, and see your photos.",
    heading: "How was the trek?",
    body: p(`Thanks for trekking <strong>${esc(b.trekTitle)}</strong> with us. We hope you came back with great memories.`)
      + p("We'd love to hear how it went. Just reply to this email with a few lines about your experience, and attach your favourite photos if you like. With your permission, we may feature them on our website.")
      + button("Plan your next trek", `${base}/treks`),
  });
}

/* ─────────────────────────── enquiries ─────────────────────────── */

export function enquiryReceived(base: string, lead: Pick<LeadEmail, "name" | "message">): Rendered {
  const first = (lead.name || "").trim().split(/\s+/)[0] || "there";
  return layout({
    base, subject: "We've got your message",
    preheader: "Thanks for getting in touch. We usually reply within one working day.",
    heading: `Thanks, ${first}!`,
    body: p("We've received your message and our team will get back to you, usually within one working day.")
      + note(`<span style="color:${C.muted};font-size:13px">Your message:</span><br/>${esc(lead.message).replace(/\n/g, "<br/>")}`)
      + p(`Need an answer sooner? Call or WhatsApp <strong>${esc(site.phone)}</strong>.`)
      + button("Browse treks", `${base}/treks`),
  });
}

// Free-form reply written by the operator in the admin panel. Plain text in,
// escaped, split into paragraphs; never raw HTML.
export function leadReply(base: string, name: string, subject: string, bodyText: string): Rendered {
  const paras = bodyText.trim().split(/\n{2,}/).map((para) => p(esc(para).replace(/\n/g, "<br/>"))).join("");
  return layout({
    base, subject, preheader: bodyText.trim().slice(0, 90),
    heading: `Hi ${(name || "").trim().split(/\s+/)[0] || "there"},`,
    body: paras + p("Warm regards,<br/><strong>Team Alpha Adventures</strong>"),
  });
}

/* ─────────────────────────── operator alerts ─────────────────────────── */

export function adminBookingAlert(base: string, kind: "pending" | "confirmed" | "cancelled", b: BookingEmail, by?: "customer" | "operator"): Rendered {
  const label = kind === "pending" ? "New booking on hold" : kind === "confirmed" ? "Booking confirmed" : `Booking cancelled${by === "customer" ? " by customer" : ""}`;
  return layout({
    base, audience: "operator", subject: `[Booking] ${label}: ${b.trekTitle} (${b.reference})`,
    preheader: `${b.trekTitle} · ${b.seats} traveller(s) · ${rupees(b.total)}`,
    heading: label,
    body: details([...bookingRows(b), ["Amount", rupees(b.total)], ["Customer", esc(b.to)]])
      + button("Open admin panel", `${base}/admin`),
  });
}

export function adminEnquiryAlert(base: string, lead: LeadEmail): Rendered {
  return layout({
    base, audience: "operator", subject: `[Enquiry] ${lead.name}${lead.subject ? `: ${lead.subject}` : ""}`,
    preheader: lead.message.slice(0, 90),
    heading: "New enquiry",
    body: details([
      ["Name", esc(lead.name)],
      ["Email", esc(lead.email)],
      ["Phone", esc(lead.phone ?? "") || "—"],
      ["Subject", esc(lead.subject ?? "") || "—"],
    ])
      + note(esc(lead.message).replace(/\n/g, "<br/>"))
      + p(`<span style="color:${C.muted};font-size:13px">Reply to this email to answer ${esc(lead.name)} directly.</span>`),
  });
}

/* ─────────────────────────── preview samples ─────────────────────────── */

// Sample data for /admin/emails. Clearly fictional.
export function emailPreviews(base: string): { key: string; label: string; audience: "Customer" | "Operator"; when: string; r: Rendered }[] {
  const b: BookingEmail = {
    to: "priya.sample@example.com", reference: "AA-7Q2K9", trekTitle: "Kalsubai Peak Trek",
    departureDate: "2026-11-14", seats: 3, total: 539700, adults: 2, children: 1,
    priceAdult: 199900, priceChild: 139900, addonsTotal: 0, startTime: "05:30:00",
    meetingPoint: "Kasara railway station, east exit", trekSlug: "kalsubai-peak-trek",
  };
  const lead: LeadEmail = { name: "Priya Sharma", email: "priya.sample@example.com", phone: "+91 98xxxxxx10", subject: "Group booking for 12", message: "Hi! We're a group of 12 from Nagpur.\nDo you have a December batch for Kalsubai?" };
  return [
    { key: "verify", label: "Confirm email", audience: "Customer", when: "Account created", r: verifyEmail(base, `${base}/verify-email?token=sample`) },
    { key: "reset", label: "Reset password", audience: "Customer", when: "Forgot password", r: resetPassword(base, `${base}/reset-password?code=sample`) },
    { key: "pending", label: "Spot on hold", audience: "Customer", when: "Booking created, awaiting payment", r: bookingPending(base, b) },
    { key: "confirmed", label: "Booking confirmed + receipt", audience: "Customer", when: "Payment completed", r: bookingConfirmed(base, b) },
    { key: "reminder", label: "Trek reminder", audience: "Customer", when: "2 days before departure", r: bookingReminder(base, b) },
    { key: "cancelled", label: "Booking cancelled", audience: "Customer", when: "Customer or team cancels", r: bookingCancelled(base, b, "customer") },
    { key: "expired", label: "Hold ended", audience: "Customer", when: "Payment not completed in time", r: holdExpired(base, b) },
    { key: "moved", label: "Date changed", audience: "Customer", when: "Team moves a departure date", r: departureChanged(base, b, { kind: "moved", oldDate: "2026-11-14", newDate: "2026-11-21" }) },
    { key: "dep-cancelled", label: "Departure cancelled", audience: "Customer", when: "Team cancels a departure", r: departureChanged(base, b, { kind: "cancelled" }) },
    { key: "review", label: "How was the trek?", audience: "Customer", when: "Day after the trek ends", r: reviewRequest(base, b) },
    { key: "enquiry", label: "We've got your message", audience: "Customer", when: "Contact form sent", r: enquiryReceived(base, lead) },
    { key: "reply", label: "Reply to enquiry", audience: "Customer", when: "Team replies from admin", r: leadReply(base, lead.name, "Re: Group booking for 12", "Thanks for reaching out!\n\nYes, we run Kalsubai every weekend in December. For a group of 12 we can offer a group price. Shall I hold seats for 6 December?") },
    { key: "a-pending", label: "New booking on hold", audience: "Operator", when: "Booking created", r: adminBookingAlert(base, "pending", b) },
    { key: "a-confirmed", label: "Booking confirmed", audience: "Operator", when: "Payment completed", r: adminBookingAlert(base, "confirmed", b) },
    { key: "a-cancelled", label: "Booking cancelled", audience: "Operator", when: "Customer cancels", r: adminBookingAlert(base, "cancelled", b, "customer") },
    { key: "a-enquiry", label: "New enquiry", audience: "Operator", when: "Contact form sent", r: adminEnquiryAlert(base, lead) },
  ];
}
