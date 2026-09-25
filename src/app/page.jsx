import fs from "fs";
import path from "path";
import { getHomeTreks } from "@/lib/trekListing";

export const dynamic = "force-dynamic";

const homeHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-home.html"),
  "utf8",
);

// Split the "Popular Treks" slider's swiper-wrapper once at module load, so we
// can inject DB-rendered slides into it per request while keeping the rest of
// the page verbatim. Balanced <div> matching handles the nested swipers.
function sliceSlider(html) {
  const anchor = html.indexOf("swiper home2-package-slider");
  if (anchor < 0) return null;
  const wrapOpen = html.indexOf('<div class="swiper-wrapper">', anchor);
  if (wrapOpen < 0) return null;
  const innerStart = html.indexOf(">", wrapOpen) + 1;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = innerStart;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[0] === "</div>") {
      if (--depth === 0) return { before: html.slice(0, innerStart), after: html.slice(m.index) };
    } else depth++;
  }
  return null;
}
const SLIDER = sliceSlider(homeHtml);

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

// SVGs copied from the legacy card so the injected markup is pixel-identical.
const LOC_SVG = '<svg width="14" height="14" viewbox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M6.83615 0C3.77766 0 1.28891 2.48879 1.28891 5.54892C1.28891 7.93837 4.6241 11.8351 6.05811 13.3994C6.25669 13.6175 6.54154 13.7411 6.83615 13.7411C7.13076 13.7411 7.41561 13.6175 7.6142 13.3994C9.04821 11.8351 12.3834 7.93833 12.3834 5.54892C12.3834 2.48879 9.89464 0 6.83615 0ZM6.83618 8.54554C8.4624 8.54554 9.7807 7.22723 9.7807 5.60102C9.7807 3.9748 8.4624 2.65649 6.83618 2.65649C5.20997 2.65649 3.89166 3.9748 3.89166 5.60102C3.89166 7.22723 5.20997 8.54554 6.83618 8.54554Z"></path></svg>';
const ARROW_SVG = '<svg class="arrow" width="25" height="6" viewbox="0 0 25 6" xmlns="http://www.w3.org/2000/svg"><path d="M0 3L5 5.88675V0.113249L0 3ZM25 3L20 0.113249V5.88675L25 3ZM4.5 3.5H20.5V2.5H4.5V3.5Z"></path></svg>';
const FALLBACK = "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80";

function cardHtml(t) {
  const href = esc(t.href);
  const badge = t.badge ? `<div class="batch"><span>${esc(t.badge)}</span></div>` : "";
  return `<div class="swiper-slide"><div class="package-card">
    <div class="package-img-wrap">
      <a href="${href}" class="package-img"><img src="${esc(t.image)}" alt="${esc(t.title)}" onerror="this.onerror=null;this.src='${FALLBACK}';"></a>
      ${badge}
    </div>
    <div class="package-content">
      <h5><a href="${href}">${esc(t.title)}</a></h5>
      <div class="location-and-time">
        <div class="location">${LOC_SVG}<a href="${href}">${esc(t.location)}</a></div>
        ${ARROW_SVG}
        <span>${esc(t.duration)}</span>
      </div>
      <div class="btn-and-price-area">
        <a href="${href}" class="primary-btn1"><span>Book Now</span><span>Book Now</span></a>
        <div class="price-area"><h6>Per Person</h6><span>${rupee(t.price)}</span></div>
      </div>
    </div>
  </div></div>`;
}

export default async function HomePage() {
  let html = homeHtml;
  if (SLIDER) {
    const treks = await getHomeTreks(8);
    if (treks.length) html = SLIDER.before + treks.map(cardHtml).join("") + SLIDER.after;
  }
  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
