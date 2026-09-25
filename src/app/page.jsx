import fs from "fs";
import path from "path";
import { getHomeTreks, getTopTreks } from "@/lib/trekListing";
import { getTours } from "@/lib/tourListing";
import { getTestimonials } from "@/lib/contentListing";

export const dynamic = "force-dynamic";

const homeHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-home.html"),
  "utf8",
);

// Find a container's inner span (after `anchor`, opening at `openTag`) via
// balanced <div> matching, so we can refill it with DB cards per request while
// keeping the rest of the page verbatim.
function sliceInner(html, anchor, openTag) {
  const a = html.indexOf(anchor);
  if (a < 0) return null;
  const open = html.indexOf(openTag, a);
  if (open < 0) return null;
  const innerStart = html.indexOf(">", open) + 1;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = innerStart;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[0] === "</div>") {
      if (--depth === 0) return { innerStart, innerEnd: m.index };
    } else depth++;
  }
  return null;
}

const PKG = sliceInner(homeHtml, "swiper home2-package-slider", '<div class="swiper-wrapper">');
const DEST = sliceInner(homeHtml, "swiper home2-destination-slider", '<div class="swiper-wrapper">');
const TOURS = sliceInner(homeHtml, "home2-oneday-trip-section", '<div class="row g-4 mb-40">');
const TESTI = sliceInner(homeHtml, "home1-testimonial-slider", '<div class="swiper-wrapper">');

// Stitch the static HTML with per-region generated cards. `regions` is
// {slice, key} in document order; each key selects the built cards at render.
const REGIONS = [
  { slice: PKG, key: "popular" },
  { slice: DEST, key: "top" },
  { slice: TOURS, key: "tours" },
  { slice: TESTI, key: "testimonials" },
].filter((r) => r.slice);
// Only stitch if every region was found and they don't overlap (document order).
const ORDERED =
  REGIONS.length === 4 &&
  REGIONS.every((r, i) => i === 0 || REGIONS[i - 1].slice.innerEnd <= r.slice.innerStart);

function stitch(html, cardsByKey) {
  let out = "";
  let cursor = 0;
  for (const r of REGIONS) {
    out += html.slice(cursor, r.slice.innerStart) + (cardsByKey[r.key] ?? "");
    cursor = r.slice.innerEnd;
  }
  return out + html.slice(cursor);
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rupee = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

const LOC_SVG = '<svg width="14" height="14" viewbox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M6.83615 0C3.77766 0 1.28891 2.48879 1.28891 5.54892C1.28891 7.93837 4.6241 11.8351 6.05811 13.3994C6.25669 13.6175 6.54154 13.7411 6.83615 13.7411C7.13076 13.7411 7.41561 13.6175 7.6142 13.3994C9.04821 11.8351 12.3834 7.93833 12.3834 5.54892C12.3834 2.48879 9.89464 0 6.83615 0ZM6.83618 8.54554C8.4624 8.54554 9.7807 7.22723 9.7807 5.60102C9.7807 3.9748 8.4624 2.65649 6.83618 2.65649C5.20997 2.65649 3.89166 3.9748 3.89166 5.60102C3.89166 7.22723 5.20997 8.54554 6.83618 8.54554Z"></path></svg>';
const ARROW_SVG = '<svg class="arrow" width="25" height="6" viewbox="0 0 25 6" xmlns="http://www.w3.org/2000/svg"><path d="M0 3L5 5.88675V0.113249L0 3ZM25 3L20 0.113249V5.88675L25 3ZM4.5 3.5H20.5V2.5H4.5V3.5Z"></path></svg>';
const FALLBACK = "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80";

function packageCard(t) {
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

function destinationCard(t) {
  const href = `/treks/${esc(t.slug)}`;
  const batches = String(t.batches).padStart(2, "0");
  return `<div class="swiper-slide"><div class="destination-card2">
    <a href="${href}" class="destination-img"><img src="${esc(t.image)}" alt="${esc(t.title)}" onerror="this.onerror=null;this.src='${FALLBACK}';"></a>
    <div class="destination-content"><h5><a href="${href}">${esc(t.title)}</a></h5><span>Batches ${batches}</span></div>
  </div></div>`;
}

function tourCard(t) {
  const href = `/tour-packages/${esc(t.slug)}`;
  return `<div class="col-lg-4 col-md-6">
    <div class="package-card media-first">
      <div class="package-img-wrap">
        <a href="${href}" class="package-img"><img src="${esc(t.image)}" alt="${esc(t.title)}" onerror="this.onerror=null;this.src='${FALLBACK}';"></a>
        <div class="package-overlay"><div class="meta"><span class="duration">${esc(t.duration)}</span></div></div>
      </div>
      <div class="package-content">
        <h5><a href="${href}">${esc(t.title)}</a></h5>
        <div class="location-and-time"><div class="location">${LOC_SVG}<a href="${href}">${esc(t.type)}</a></div></div>
        <div class="btn-and-price-area">
          <a href="${href}" class="primary-btn1">Book Now</a>
          <div class="price-area"><h6>Per Person</h6><span>${rupee(t.price)}</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

function testimonialCard(t) {
  const full = Math.max(0, Math.min(5, Math.round(t.rating || 5)));
  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? "<li>&#9733;</li>" : "<li>&#9734;</li>")).join("");
  return `<div class="swiper-slide"><div class="testimonial-card three">
    <ul class="rating-area">${stars}</ul>
    <p>${esc(t.body)}</p>
    <div class="author-area">
      <div class="author-img"><img src="${esc(t.avatar_url)}" alt="${esc(t.author)}" onerror="this.onerror=null;this.src='${FALLBACK}';"></div>
      <div class="author-info"><h5>${esc(t.author)}</h5><span>${esc(t.role)}</span></div>
    </div>
  </div></div>`;
}

export default async function HomePage() {
  let html = homeHtml;
  if (ORDERED) {
    const [popular, top, tours, testimonials] = await Promise.all([
      getHomeTreks(8), getTopTreks(7), getTours(), getTestimonials(),
    ]);
    if (popular.length && top.length && tours.length && testimonials.length) {
      html = stitch(html, {
        popular: popular.map(packageCard).join(""),
        top: top.map(destinationCard).join(""),
        tours: tours.map(tourCard).join(""),
        testimonials: testimonials.map(testimonialCard).join(""),
      });
    }
  }
  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
