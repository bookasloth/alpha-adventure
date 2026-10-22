import Link from "next/link";
import { site } from "@/data/site";
import { sectionOf, SECTION_META, canonicalPath } from "@/lib/sections";
import Accordion from "./Accordion";
import TrekTabs from "./TrekTabs";
import TrekSectionNav from "./TrekSectionNav";
import TrekCard from "@/components/ui/TrekCard";
import DownloadItinerary from "./DownloadItinerary";
import TrekHeroSlider from "./TrekHeroSlider";
import RoutePricingCards, { RoutePricingCard } from "./RoutePricingCards";
import NotToMissSlider from "./NotToMissSlider";

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

function Fact({ icon, label, value, href }) {
  if (!value) return null;
  return (
    <li className="flex items-center gap-3">
      <span className="text-primary"><i className={`bi ${icon}`} /></span>
      <div className="content">
        <span className="mb-1.5 block text-sm text-gray-500">{label}</span>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="block text-base font-medium text-ink hover:text-primary hover:underline">
            {value}
          </a>
        ) : (
          <strong className="block text-base font-medium text-ink">{value}</strong>
        )}
      </div>
    </li>
  );
}

// Trek detail in the legacy theme skin (mirrors the trek-detail template),
// driven by a single joined trek object from Supabase.
export default function TrekDetail({ trek }) {
  const durationLabel = trek.duration_days ? `${trek.duration_days} Day${trek.duration_days > 1 ? "s" : ""}` : null;
  const bookHref = `/book/${trek.slug}`;
  const section = SECTION_META[sectionOf(trek.group) ?? "treks"];
  const basecampLabel = [trek.base_camp, trek.location, trek.state].filter(Boolean).join(", ");
  const mapsHref = basecampLabel
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(basecampLabel)}`
    : null;
  // Hero slider: hero image first, then unique gallery photos.
  const heroImages = [...new Set([trek.hero_image, ...trek.gallery.map((g) => g.image_url)].filter(Boolean))];

  const sections = [];
  sections.push({
    id: "overview",
    label: "Overview",
    node: (
      <div>
        <div className="package-info-wrap mb-0">
          <ul className="package-info-list grid grid-cols-1 gap-x-8 gap-y-8 rounded-[20px] border border-line/70 p-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            <Fact icon="bi-clock" label="Duration" value={durationLabel} />
            <Fact icon="bi-graph-up" label="Difficulty" value={cap(trek.difficulty)} />
            <Fact icon="bi-arrows-fullscreen" label="Highest Altitude" value={trek.altitude} />
            <Fact icon="bi-house" label="Base Camp" value={trek.base_camp} href={mapsHref} />
            <Fact icon="bi-calendar-check" label="Best Season" value={trek.best_season} />
            <Fact icon="bi-people" label="Group Size" value={trek.group_size} />
            <Fact icon="bi-person-bounding-box" label="Suitable for Age" value={trek.suitable_age} />
            <Fact icon="bi-house-door" label="Accommodation" value={trek.accommodation} />
            <Fact icon="bi-heart-pulse" label="Fitness Criteria" value={trek.fitness_criteria} />
            {trek.location && <Fact icon="bi-geo-alt" label="Location" value={trek.location} href={mapsHref} />}
            {trek.state && <Fact icon="bi-map" label="State" value={trek.state} />}
            {trek.region && <Fact icon="bi-compass" label="Region" value={trek.region} />}
          </ul>
        </div>
      </div>
    ),
  });
  sections.push({
    id: "about",
    label: "About",
    node: (
      <div className="package-info-wrap">
        <div id="about-trek-content" className="about-content">
          <p>{trek.overview || trek.summary}</p>
        </div>
      </div>
    ),
  });
  if (trek.not_to_miss?.length > 0) {
    sections.push({
      id: "not-to-miss",
      label: "Not to Miss",
      node: <NotToMissSlider items={trek.not_to_miss} />,
    });
  }
  if (trek.itinerary.length > 0) {
    const dayChips = (d) => {
      const chips = [];
      const trek = [d.trek_distance, d.trek_duration].filter(Boolean).join(" · ");
      if (trek) chips.push({ icon: "bi-signpost-split", label: "Trek", value: trek });
      const drive = [d.drive_distance, d.drive_duration].filter(Boolean).join(" · ");
      if (drive) chips.push({ icon: "bi-truck", label: "Drive", value: drive });
      const alt = [d.altitude_gain && `↑ ${d.altitude_gain}`, d.altitude_loss && `↓ ${d.altitude_loss}`].filter(Boolean).join(" · ");
      if (alt) chips.push({ icon: "bi-arrows-vertical", label: "Altitude", value: alt });
      if (d.meals) chips.push({ icon: "bi-cup-hot", label: "Meals", value: d.meals });
      return chips;
    };
    sections.push({
      id: "itinerary",
      label: "Itinerary",
      node: (
        <div>
          <Accordion
            defaultOpen={-1}
            items={trek.itinerary.map((d) => ({
              title: (
                <span className="flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary"><i className="bi bi-geo-alt-fill" /> Day {d.day_no}</span>
                  <span className="text-[17px] font-bold leading-snug text-ink">{d.title}</span>
                </span>
              ),
              body: (
                <>
                  {dayChips(d).length > 0 && (
                    <div className="mb-4 grid grid-cols-4 gap-2">
                      {dayChips(d).map((m) => (
                        <span key={m.label} className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-line/70 bg-page px-2.5 py-1.5 text-xs">
                          <i className={`bi ${m.icon} shrink-0 text-primary`} />
                          <span className="shrink-0 text-gray-500">{m.label}</span>
                          <strong className="truncate font-semibold text-ink">{m.value}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                  {d.description && <p className="leading-relaxed text-gray-600">{d.description}</p>}
                  {d.image && <img src={d.image} alt={d.title} className="mt-3.5 block h-[220px] w-full max-w-[460px] rounded-xl2 object-cover" />}
                </>
              ),
            }))}
          />
        </div>
      ),
    });
  }
  if (trek.inclusions.length > 0 || trek.exclusions.length > 0) {
    sections.push({
      id: "inclusions",
      label: "Inclusions",
      node: (
        <div className="grid gap-8 sm:grid-cols-2">
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
      ),
    });
  }
  if (trek.packages.length > 0) {
    sections.push({
      id: "packages",
      label: "Packages",
      node: (
        <div>
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
      ),
    });
  }
  if (trek.gallery.length > 0) {
    sections.push({
      id: "gallery",
      label: "Gallery",
      action: (
        <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          View full gallery <i className="bi bi-arrow-right" />
        </Link>
      ),
      node: (
        <div className="photo-gallery-area">
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
      ),
    });
  }
  if (trek.faqs.length > 0) {
    sections.push({
      id: "faq",
      label: "FAQ",
      node: (
        <div>
          <Accordion items={trek.faqs.map((f) => ({
            title: <span className="font-semibold text-ink">{f.question}</span>,
            body: <p className="leading-relaxed">{f.answer}</p>,
          }))} />
        </div>
      ),
    });
  }

  return (
    <div className="trek-detail">
      {/* HERO BANNER — self-contained slider (hero image + gallery photos) */}
      <div className="breadcrumb-section two" id="section-hero-slider" style={{ position: "relative", minHeight: "80svh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <TrekHeroSlider images={heroImages} title={trek.title} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(17,15,15,.25) 0%, rgba(17,15,15,.72) 100%)" }} />
        <div className="banner-content-wrap" style={{ position: "relative", width: "100%", paddingTop: 80 }}>
          <div className="container">
            <div className="banner-content" style={{ color: "#fff" }}>
              <nav style={{ marginBottom: 12, fontSize: 14, color: "rgba(255,255,255,.8)" }}>
                <Link href="/" style={{ color: "inherit" }}>Home</Link><span className="mx-2">›</span>
                <Link href={section.href} style={{ color: "inherit" }}>{section.label}</Link><span className="mx-2">›</span>
                {trek.state && <><span>{trek.state}</span><span className="mx-2">›</span></>}
                <span style={{ color: "#fff" }}>{trek.title}</span>
              </nav>
              <h1 id="trek-title" style={{ color: "#fff", marginBottom: 10 }}>{trek.title}</h1>
              {(trek.summary || trek.location) && (
                <p id="trek-subtitle" style={{ color: "rgba(255,255,255,.85)", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
                  {trek.summary || trek.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="package-details-page pt-100 mb-100">
        <div className="container">
          {/* SECTION NAV — full-width bar above the two-column row; the cost
              card sits below it in the right column. */}
          <TrekSectionNav
            sections={sections.filter((s) => s.id !== "booking")}
            trailing={<DownloadItinerary trek={trek} itinerary={trek.itinerary} />}
          />

          <div className="row g-lg-4 gy-5 justify-content-between">
            <div className="col-xl-8 col-lg-7">
              <div className="space-y-16">
                {sections
                  .filter((s) => s.id !== "booking")
                  .map((s) => (
                    <section key={s.id} id={`section-${s.id}`} className="scroll-mt-28">
                      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-2xl font-bold text-ink">{s.label}</h3>
                        {s.action}
                      </div>
                      {s.node}
                    </section>
                  ))}
              </div>

            </div>
            <div className="col-xl-4 col-lg-5">
              <div className="lg:sticky lg:top-[110px]">
                {/* TREK COST — sidebar, under the booking card */}
                <div id="section-trek-cost">
                  <RoutePricingCard slug={trek.slug} bookHref={bookHref} variant="trek" />
                </div>
              </div>
            </div>
          </div>

          {/* RELEVANT TREKS / TRIPS */}
          {trek.relevant.length > 0 && (
            <section className="mt-16" id="section-relevant">
              <div className="mb-6 flex items-end justify-between">
                <h3 className="text-2xl font-bold text-ink">You may also like</h3>
                <Link href={section.href} className="text-sm font-semibold text-primary hover:underline">
                  View all {section.label.toLowerCase()} <i className="bi bi-arrow-right" />
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {trek.relevant.map((t) => (
                  <TrekCard
                    key={t.slug}
                    href={canonicalPath(t)}
                    trek={{
                      ...t,
                      image: t.hero_image,
                      price: t.base_price != null ? t.base_price / 100 : 0,
                      duration: t.duration_days ? `${t.duration_days} Day${t.duration_days > 1 ? "s" : ""}` : undefined,
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* FROM THE BLOG */}
          {trek.posts.length > 0 && (
            <section className="mt-16" id="section-blog">
              <div className="mb-6 flex items-end justify-between">
                <h3 className="text-2xl font-bold text-ink">From the Blog</h3>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {trek.posts.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="flex flex-col rounded-xl2 border border-line/70 bg-white p-6 transition hover:border-primary hover:shadow-soft"
                  >
                    {p.published_at && (
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-primary">
                        {new Date(p.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    )}
                    <h4 className="mb-2 text-lg font-bold text-ink">{p.title}</h4>
                    {p.excerpt && <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">{p.excerpt}</p>}
                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      Read story <i className="bi bi-arrow-right" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
