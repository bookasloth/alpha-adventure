import Link from "next/link";
import { site } from "@/data/site";
import Accordion from "./Accordion";

const rupees = (paise) => "₹" + (paise / 100).toLocaleString("en-IN");
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// CTA arrow, matches the theme's inline-svg buttons.
const BtnArrow = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
// Site-standard button (globals .btn-primary / .btn-secondary).
function PrimaryBtn({ href, external, label, secondary, className = "" }) {
  const cls = `${secondary ? "btn-secondary" : "btn-primary"} ${className}`.trim();
  const inner = <>{label} <BtnArrow /></>;
  return external
    ? <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
    : <Link href={href} className={cls}>{inner}</Link>;
}

function Fact({ icon, label, value }) {
  if (!value) return null;
  return (
    <li>
      <span><i className={`bi ${icon}`} /></span>
      <div className="content"><span>{label}</span><strong>{value}</strong></div>
    </li>
  );
}

// Trek detail in the legacy theme skin (mirrors the trek-detail template),
// driven by a single joined trek object from Supabase.
export default function TrekDetail({ trek }) {
  const durationLabel = trek.duration_days ? `${trek.duration_days} Day${trek.duration_days > 1 ? "s" : ""}` : null;
  const bookHref = `/book/${trek.slug}`;

  return (
    <div className="trek-detail">
      {/* HERO BANNER — self-contained (theme's swiper banner needs JS/height we don't run here) */}
      <div className="breadcrumb-section two" id="section-hero-slider" style={{ position: "relative", minHeight: 460, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <div className="banner-bg" aria-hidden="true"
          style={{ position: "absolute", inset: 0, backgroundImage: trek.hero_image ? `url(${trek.hero_image})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(17,15,15,.25) 0%, rgba(17,15,15,.72) 100%)" }} />
        <div className="banner-content-wrap" style={{ position: "relative", width: "100%", paddingBottom: 48 }}>
          <div className="container">
            <div className="banner-content" style={{ color: "#fff" }}>
              <nav style={{ marginBottom: 12, fontSize: 14, color: "rgba(255,255,255,.8)" }}>
                <Link href="/" style={{ color: "inherit" }}>Home</Link><span className="mx-2">›</span>
                <Link href="/treks/backpacking-trips" style={{ color: "inherit" }}>Backpacking Trips</Link><span className="mx-2">›</span>
                {trek.state && <><span>{trek.state}</span><span className="mx-2">›</span></>}
                <span style={{ color: "#fff" }}>{trek.title}</span>
              </nav>
              <h1 id="trek-title" style={{ color: "#fff", marginBottom: 10 }}>{trek.title}</h1>
              {(trek.summary || trek.location) && <p id="trek-subtitle" style={{ color: "rgba(255,255,255,.85)", maxWidth: 640 }}>{trek.summary || trek.location}</p>}
              <div className="batch" id="trek-batch" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                {durationLabel && <span style={{ color: "#fff" }}><i className="bi bi-clock" /> {durationLabel}</span>}
                {trek.difficulty && <span style={{ color: "#fff" }}><i className="bi bi-graph-up" /> {cap(trek.difficulty)}</span>}
                {trek.region && <span style={{ color: "#fff" }}><i className="bi bi-geo-alt" /> {trek.region}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRUST BAR */}
      <div className="package-details-breadcrumb-bottom">
        <div className="container">
          <div className="details-breadcrumb-bottom-wrapper">
            <div className="left-content">
              <ul>
                <li><i className="bi bi-check-circle" /> No Booking Fee</li>
                <li><i className="bi bi-check-circle" /> Best Price Ever</li>
              </ul>
              <span className="rating-area"><strong>(4.8/5)</strong><span>trusted by thousands of trekkers</span></span>
            </div>
            <div className="right-content">
              <span><i className="bi bi-shield-check" /> Safety First</span>
            </div>
          </div>
        </div>
      </div>

      <div className="package-details-page pt-100 mb-100">
        <div className="container">
          {/* OVERVIEW / QUICK FACTS */}
          <div className="row col-xl-12 w-100" id="section-overview">
            <h4>Trek Overview</h4>
            <div className="package-details-warpper">
              <div className="package-info-wrap mb-60">
                <ul className="package-info-list info-grid-4">
                  <Fact icon="bi-clock" label="Duration" value={durationLabel} />
                  <Fact icon="bi-graph-up" label="Difficulty" value={cap(trek.difficulty)} />
                  <Fact icon="bi-arrows-fullscreen" label="Highest Altitude" value={trek.altitude} />
                  <Fact icon="bi-house" label="Base Camp" value={trek.base_camp} />
                  <Fact icon="bi-calendar-check" label="Best Season" value={trek.best_season} />
                  <Fact icon="bi-people" label="Group Size" value={trek.group_size} />
                </ul>
              </div>
            </div>
          </div>

          <div className="row g-lg-4 gy-5 justify-content-between">
            {/* LEFT COLUMN */}
            <div className="col-xl-7 col-lg-8" id="package-main-left">
              <div className="package-details-warpper">
                {/* ABOUT */}
                <div className="package-info-wrap mb-60" id="section-about-trek">
                  <h4>About the Trek</h4>
                  <div id="about-trek-content" className="about-content">
                    <p>{trek.overview || trek.summary}</p>
                  </div>
                </div>

                {/* ITINERARY */}
                {trek.itinerary.length > 0 && (
                  <div className="mb-60" id="section-itinerary">
                    <h4 className="mb-4">Trek Itinerary</h4>
                    <Accordion items={trek.itinerary.map((d) => ({
                      title: (
                        <span className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary"><i className="bi bi-geo-alt-fill" /> Day {d.day_no}</span>
                          <span className="text-[17px] font-bold leading-snug text-ink">{d.title}</span>
                        </span>
                      ),
                      body: (
                        <>
                          {d.description && <p className="leading-relaxed text-gray-600">{d.description}</p>}
                          {d.image && <img src={d.image} alt={d.title} className="mt-3.5 block h-[220px] w-full max-w-[460px] rounded-xl2 object-cover" />}
                        </>
                      ),
                    }))} />
                  </div>
                )}

                {/* INCLUSIONS / EXCLUSIONS */}
                {(trek.inclusions.length > 0 || trek.exclusions.length > 0) && (
                  <div className="mb-60 grid gap-8 sm:grid-cols-2" id="section-inclusions">
                    <div>
                      <h4 className="mb-4">What&apos;s Included</h4>
                      <ul className="space-y-3">
                        {trek.inclusions.map((t, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-gray-600"><i className="bi bi-check-circle-fill mt-0.5 text-green-600" /> {t}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-4">Not Included</h4>
                      <ul className="space-y-3">
                        {trek.exclusions.map((t, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-gray-600"><i className="bi bi-x-circle-fill mt-0.5 text-red-500" /> {t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* PACKAGES */}
                {trek.packages.length > 0 && (
                  <div className="mb-60" id="section-packages">
                    <h4 className="mb-4">Packages</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {trek.packages.map((p, i) => (
                        <div key={i} className="flex flex-col rounded-xl2 border border-line/70 bg-white p-6">
                          <h6 className="mb-1 font-bold text-ink">{p.name}</h6>
                          <div className="mb-3 text-[22px] font-extrabold text-primary">{rupees(p.price)} <small className="font-medium text-gray-500">/ person</small></div>
                          <ul className="mb-5 flex-1 space-y-2.5">
                            {p.inclusions.map((t, j) => (
                              <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600"><i className="bi bi-check-circle-fill mt-0.5 text-green-600" /> {t}</li>
                            ))}
                          </ul>
                          <PrimaryBtn href={bookHref} label={p.cta_label || "Book Now"} className="w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GALLERY */}
                {trek.gallery.length > 0 && (
                  <div className="photo-gallery-area mb-60" id="section-photo-gallery">
                    <h4>Photo Gallery</h4>
                    <div className="row g-3" id="trek-gallery-grid">
                      {trek.gallery.map((g, i) => (
                        <div className="col-lg-4 col-md-6 col-6 gallery-item-col" key={i}>
                          <a className="gallery-item-card" data-fancybox="trek-gallery" href={g.image_url} data-caption={g.caption || ""} style={{ display: "block" }}>
                            <img src={g.image_url} alt={g.caption || `Trek photo ${i + 1}`} className="gallery-img" />
                            <div className="gallery-item-hover"><i className="bi bi-eye" /></div>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ */}
                {trek.faqs.length > 0 && (
                  <div className="mb-60" id="section-faq">
                    <h4 className="mb-4">Frequently Asked</h4>
                    <Accordion items={trek.faqs.map((f) => ({
                      title: <span className="font-semibold text-ink">{f.question}</span>,
                      body: <p className="leading-relaxed">{f.answer}</p>,
                    }))} />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="col-lg-4" id="package-main-right">
              <div className="package-details-sidebar lg:sticky lg:top-[110px]">
                <div className="pricing-and-booking-area mb-40">
                  <div className="price-area">
                    <h6>Starting From</h6>
                    <span>{trek.base_price != null ? rupees(trek.base_price) : "—"}<sub>/per person</sub></span>
                  </div>
                  <ul>
                    <li><i className="bi bi-shield-check" /> Your safety is our top priority.</li>
                    <li><i className="bi bi-people" /> Small, expert-led batches.</li>
                    <li><i className="bi bi-arrow-repeat" /> Free cancellation up to 72h before.</li>
                  </ul>
                  <PrimaryBtn href={bookHref} label="Book Now" className="mb-3 w-full" />
                  <PrimaryBtn href={site.whatsapp} external secondary label="Enquire on WhatsApp" className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
