import Link from "next/link";
import { site } from "@/data/site";

const rupees = (paise) => "₹" + (paise / 100).toLocaleString("en-IN");
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// CTA arrow, matches the theme's inline-svg buttons.
const BtnArrow = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
// The theme's primary button duplicates its label in two spans (hover swap).
function PrimaryBtn({ href, external, label, variant = "" }) {
  const cls = `primary-btn1${variant ? " " + variant : ""}`;
  const inner = <><span>{label} <BtnArrow /></span><span>{label} <BtnArrow /></span></>;
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
                  <div className="tour-itinerary-area mb-60" id="section-itinerary">
                    <div className="itinerary-title"><h4>Trek Itinerary</h4></div>
                    <div className="accordion accordion-flush itinerary-accordion" id="trekAccordion">
                      {trek.itinerary.map((d, i) => {
                        const hid = `heading-itinerary-${d.day_no}`;
                        const cid = `day-itinerary-${d.day_no}`;
                        const first = i === 0;
                        return (
                          <div className="accordion-item" key={d.day_no}>
                            <h2 className="accordion-header" id={hid}>
                              <button className={`accordion-button${first ? "" : " collapsed"}`} type="button"
                                data-bs-toggle="collapse" data-bs-target={`#${cid}`} aria-expanded={first ? "true" : "false"} aria-controls={cid}>
                                <span className="day-title-wrap">
                                  <span className="day-chip"><i className="bi bi-geo-alt-fill" /> Day {d.day_no}</span>
                                  <span className="day-main-title">{d.title}</span>
                                </span>
                              </button>
                            </h2>
                            <div id={cid} className={`accordion-collapse collapse${first ? " show" : ""}`} aria-labelledby={hid} data-bs-parent="#trekAccordion">
                              <div className="accordion-body">
                                {d.description && <ul className="timeline"><li><i className="bi bi-clock-fill" /> {d.description}</li></ul>}
                                {d.image && (
                                  <img src={d.image} alt={d.title} style={{ width: "100%", maxWidth: 460, height: 220, objectFit: "cover", borderRadius: 12, marginTop: 14, display: "block" }} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* INCLUSIONS / EXCLUSIONS */}
                {(trek.inclusions.length > 0 || trek.exclusions.length > 0) && (
                  <div className="package-info-wrap mb-60" id="section-inclusions">
                    <div className="row">
                      <div className="col-md-6">
                        <h4>What&apos;s Included</h4>
                        <ul className="timeline">
                          {trek.inclusions.map((t, i) => (<li key={i}><i className="bi bi-check-circle-fill" style={{ color: "#16a34a" }} /> {t}</li>))}
                        </ul>
                      </div>
                      <div className="col-md-6">
                        <h4>Not Included</h4>
                        <ul className="timeline">
                          {trek.exclusions.map((t, i) => (<li key={i}><i className="bi bi-x-circle-fill" style={{ color: "#dc2626" }} /> {t}</li>))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* PACKAGES */}
                {trek.packages.length > 0 && (
                  <div className="package-info-wrap mb-60" id="section-packages">
                    <h4>Packages</h4>
                    <div className="row g-3">
                      {trek.packages.map((p, i) => (
                        <div className="col-md-6" key={i}>
                          <div className="itinerary-meta" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                            <h6 style={{ fontWeight: 700, marginBottom: 4 }}>{p.name}</h6>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--primary-color1)", marginBottom: 10 }}>{rupees(p.price)} <small style={{ color: "#6b7280", fontWeight: 500 }}>/ person</small></div>
                            <ul className="timeline" style={{ flex: 1 }}>
                              {p.inclusions.map((t, j) => (<li key={j}><i className="bi bi-check-circle-fill" style={{ color: "#16a34a" }} /> {t}</li>))}
                            </ul>
                            <div style={{ marginTop: 12 }}><PrimaryBtn href={bookHref} label={p.cta_label || "Book Now"} variant="two" /></div>
                          </div>
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
                  <div className="tour-itinerary-area mb-60" id="section-faq">
                    <div className="itinerary-title"><h4>Frequently Asked</h4></div>
                    <div className="accordion accordion-flush itinerary-accordion" id="faqAccordion">
                      {trek.faqs.map((f, i) => {
                        const hid = `faq-h-${i}`;
                        const cid = `faq-c-${i}`;
                        const first = i === 0;
                        return (
                          <div className="accordion-item" key={i}>
                            <h2 className="accordion-header" id={hid}>
                              <button className={`accordion-button${first ? "" : " collapsed"}`} type="button"
                                data-bs-toggle="collapse" data-bs-target={`#${cid}`} aria-expanded={first ? "true" : "false"} aria-controls={cid}>
                                <span className="day-main-title">{f.question}</span>
                              </button>
                            </h2>
                            <div id={cid} className={`accordion-collapse collapse${first ? " show" : ""}`} aria-labelledby={hid} data-bs-parent="#faqAccordion">
                              <div className="accordion-body"><p style={{ margin: 0, color: "#374151" }}>{f.answer}</p></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="col-lg-4" id="package-main-right">
              <div className="package-details-sidebar">
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
                  <PrimaryBtn href={bookHref} label="Book Now" variant="mb-20" />
                  <PrimaryBtn href={site.whatsapp} external label="Enquire on WhatsApp" variant="transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
