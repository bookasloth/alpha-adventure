import fs from "fs";
import path from "path";
import TravelCalendarScripts from "@/components/TravelCalendarScripts";
import { publicClient } from "@/lib/seo";
import { canonicalPath } from "@/lib/sections";

export const revalidate = 300;

const calendarHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-travel-calendar.html"),
  "utf8"
);
const calendarInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/travel-calendar-init.js"),
  "utf8"
);

export const metadata = { title: "Travel Calendar" };

// The static page shipped hardcoded demo cards (with href="#" Book Now). We
// swap the `.trek-list` contents for real upcoming departures; the filter JS
// in travel-calendar-init.js reads the same data-* attributes.
const LIST_OPEN = '<div class="trek-list">';
const LIST_END = "<!-- Empty State -->";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (d) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const CATEGORY = { backpacking: "backpacking", "near-nagpur": "nagpur" };
const BADGE = { beginner: ["easy", "Easy"], moderate: ["moderate", "Moderate"], difficult: ["difficult", "Difficult"] };

async function getDepartures() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await publicClient()
    .from("trek_departures")
    .select("start_date,end_date,capacity,booked_seats,price_override,status,treks!inner(slug,title,location,state,group,difficulty,days,duration_label,base_price,hero_image,status,deleted_at)")
    .gte("start_date", today)
    .neq("status", "cancelled")
    .eq("treks.status", "published")
    .is("treks.deleted_at", null)
    .order("start_date");
  if (error) console.error("[travel-calendar]", error.message);
  return data ?? [];
}

function card(d) {
  const t = d.treks;
  const href = esc(canonicalPath(t));
  const price = Math.round((d.price_override ?? t.base_price ?? 0) / 100);
  const left = Math.max(0, d.capacity - d.booked_seats);
  const days = t.days || (d.end_date ? Math.round((Date.parse(d.end_date) - Date.parse(d.start_date)) / 864e5) + 1 : 0);
  const [badgeCls, badgeLbl] = BADGE[t.difficulty] ?? [];
  const place = t.location || t.state || "";
  return `<div class="trek-card" data-category="${CATEGORY[t.group] ?? "upcoming"}" data-price="${price}" data-month="${Number(d.start_date.slice(5, 7))}"
    data-destination="${esc((t.state || place).toLowerCase())}" data-duration="${days}"
    data-search="${esc(`${t.title} ${place}`.toLowerCase())}" data-date="${d.start_date}">
    <div class="trek-card-img"><a href="${href}"><img src="${esc(t.hero_image || "/assets/img/home2/destination-img1.jpg")}" alt="${esc(t.title)}"></a></div>
    <div class="trek-card-body">
      <div class="trek-card-header">
        <div class="trek-info">
          <h6 class="trek-name"><a href="${href}">${esc(t.title)}</a></h6>
          ${place ? `<div class="trek-location"><i class="bi bi-geo-alt"></i> ${esc(place)}</div>` : ""}
        </div>
        <div class="trek-actions"><a href="${href}" class="primary-btn1 btn-sm"><span>Book Now</span><span>Book Now</span></a></div>
      </div>
      <div class="trek-meta">
        <div class="trek-meta-item"><i class="bi bi-calendar3"></i> ${fmt(d.start_date)}${d.end_date ? ` – ${fmt(d.end_date)}` : ""}</div>
        ${t.duration_label || days ? `<div class="trek-meta-item"><i class="bi bi-clock"></i> ${esc(t.duration_label || `${days} Days`)}</div>` : ""}
        <div class="trek-meta-item"><i class="bi bi-people"></i> ${left ? `${left} spots left` : "Sold out"}</div>
        ${badgeCls ? `<div class="trek-meta-item"><span class="badge-custom badge-${badgeCls}">${badgeLbl}</span></div>` : ""}
      </div>
      <div class="trek-price"><span class="price-label">Starting From</span><span class="price-value">₹${price.toLocaleString("en-IN")} Onwards</span></div>
    </div>
  </div>`;
}

export default async function TravelCalendarPage() {
  let html = calendarHtml;
  const a = html.indexOf(LIST_OPEN);
  const b = html.indexOf(LIST_END);
  if (a >= 0 && b > a) {
    const cards = (await getDepartures()).map(card).join("");
    html = html.slice(0, a + LIST_OPEN.length) + cards + "</div>\n" + html.slice(b);
    if (!cards) html = html.replace('id="emptyState" style="display: none;"', 'id="emptyState"');
  }
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <TravelCalendarScripts initCode={calendarInit} />
    </>
  );
}
