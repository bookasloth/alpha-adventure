import Link from "next/link";
import { img } from "@/lib/assets";
import { site } from "@/data/site";
import PhotoGallerySlider from "@/components/treks/PhotoGallerySlider";

// Full destination-details view for a trip, matching the existing Alpha site
// design language (dark hero + breadcrumb bottom bar + overview info grid +
// about + itinerary accordion + photo gallery slider + package features +
// sticky pricing sidebar).
export default function TripDetail({ trek }) {
  const overview = trek.overview || {};
  const gallery = trek.gallery?.length ? trek.gallery : [trek.image];
  const itinerary = trek.itinerary || [];
  const inclusions = trek.inclusions || [];
  const exclusions = trek.exclusions || [];
  const rating = trek.rating || site.rating;
  const reviewCount = trek.reviewCount || "3,545";

  const heroImage = trek.image;

  return (
    <>
      {/* ===== Hero banner ===== */}
      <section className="relative bg-dark text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="container-px relative pt-14 pb-20">
          {trek.badge && (
            <span className="inline-block bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {trek.badge}
            </span>
          )}
          <h1 className="text-3xl sm:text-5xl font-bold max-w-3xl">{trek.title}</h1>
          {overview.duration && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm backdrop-blur">
              <i className="bi bi-clock" />
              {overview.duration}
            </div>
          )}
        </div>
      </section>

      {/* ===== Breadcrumb bottom bar ===== */}
      <section className="border-y border-line bg-white">
        <div className="container-px flex flex-wrap items-center justify-between gap-4 py-4">
          <nav className="text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/treks/trips-near-nagpur" className="hover:text-primary">Trips Near Nagpur</Link>
            <span className="mx-2">/</span>
            <span className="text-ink font-medium">{trek.title}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" className="text-primary" fill="currentColor">
                <path d="M11.544 3.68665L4.87161 10.3626C4.76529 10.4653 4.63053 10.5186 4.49589 10.5186C4.42605 10.5187 4.35687 10.505 4.29236 10.4782C4.22785 10.4514 4.16929 10.4122 4.12005 10.3626L0.457651 6.70021C0.248491 6.49453 0.248491 6.15781 0.457651 5.94865L1.75173 4.65097C1.95033 4.45249 2.30481 4.45249 2.50341 4.65097L4.49589 6.64346L9.49833 1.63741C9.54761 1.58803 9.60613 1.54883 9.67055 1.52206C9.73498 1.49529 9.80405 1.48148 9.87381 1.48141C10.0155 1.48141 10.1503 1.53817 10.2495 1.63741L11.5436 2.93521C11.7531 3.14437 11.7531 3.48109 11.544 3.68665Z" />
              </svg>
              No Booking Fee
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-600">
              <svg width="14" height="14" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" className="text-primary" fill="currentColor">
                <path d="M11.544 3.68665L4.87161 10.3626C4.76529 10.4653 4.63053 10.5186 4.49589 10.5186C4.42605 10.5187 4.35687 10.505 4.29236 10.4782C4.22785 10.4514 4.16929 10.4122 4.12005 10.3626L0.457651 6.70021C0.248491 6.49453 0.248491 6.15781 0.457651 5.94865L1.75173 4.65097C1.95033 4.45249 2.30481 4.45249 2.50341 4.65097L4.49589 6.64346L9.49833 1.63741C9.54761 1.58803 9.60613 1.54883 9.67055 1.52206C9.73498 1.49529 9.80405 1.48148 9.87381 1.48141C10.0155 1.48141 10.1503 1.53817 10.2495 1.63741L11.5436 2.93521C11.7531 3.14437 11.7531 3.48109 11.544 3.68665Z" />
              </svg>
              Best Price Ever
            </span>
            <span className="inline-flex items-center gap-1.5 text-gray-600">
              <span className="font-bold text-ink">({rating})</span>
              <span className="text-gray-500">based on {reviewCount} reviews</span>
            </span>
          </div>
        </div>
      </section>

      {/* ===== Main content ===== */}
      <div className="container-px py-14 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* Overview */}
          <section id="overview">
            <h2 className="text-2xl font-bold text-ink mb-4">Trek Overview</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: "bi bi-clock", label: "Duration", value: overview.duration || trek.duration },
                { icon: "bi bi-geo-alt", label: "Difficulty", value: overview.difficulty || "Beginner Friendly" },
                { icon: "bi bi-person", label: "Age Group", value: overview.ageGroup || "12-60 yrs" },
                { icon: "bi bi-mountain", label: "Highest Altitude", value: overview.highestAltitude || "—" },
              ].map((item) => (
                <div key={item.label} className="card p-4 text-center">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <i className={item.icon} />
                  </span>
                  <span className="mt-3 block text-xs text-gray-500">{item.label}</span>
                  <strong className="mt-1 block text-sm text-ink">{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          {/* About */}
          <section id="about">
            <h2 className="text-2xl font-bold text-ink mb-3">About the Trek</h2>
            <p className="text-gray-600 leading-relaxed">{trek.about || trek.description}</p>
          </section>

          {/* Itinerary */}
          {itinerary.length > 0 && (
            <section id="itinerary">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-ink mb-4">Trek Itinerary</h2>
              </div>
              <div className="space-y-4">
                {itinerary.map((day, di) => (
                  <details key={di} className="card overflow-hidden" open={di === 0}>
                    <summary className="flex cursor-pointer items-start gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                      <span className="mt-1 text-sm font-bold uppercase tracking-wide text-primary">
                        <i className="bi bi-geo-alt-fill mr-1" />Day {day.day}
                      </span>
                      <span className="text-sm text-gray-600">{day.title}</span>
                    </summary>
                    <div className="border-t border-line px-5 py-4">
                      <ul className="grid gap-2.5">
                        {day.slots.map((slot, si) => (
                          <li key={si} className="flex items-start gap-3 text-sm text-gray-600">
                            <i className="bi bi-clock-fill mt-0.5 text-primary" />
                            <span className="min-w-[70px] font-semibold text-ink">{slot.time}</span>
                            <span>{slot.activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Photo Gallery */}
          <section id="photo-gallery">
            <h2 className="text-2xl font-bold text-ink mb-4">Photo Gallery</h2>
            <PhotoGallerySlider images={gallery} title={trek.title} />
          </section>

          {/* Package Features */}
          {(inclusions.length > 0 || exclusions.length > 0) && (
            <section id="package-features">
              <h2 className="text-2xl font-bold text-ink mb-4">Package Features</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {inclusions.length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-bold text-ink mb-3">Inclusions</h3>
                    <ul className="space-y-2">
                      {inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <i className="bi bi-check-circle-fill mt-0.5 text-primary" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-bold text-ink mb-3">Exclusions</h3>
                    <ul className="space-y-2">
                      {exclusions.map((exc, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <i className="bi bi-x-circle-fill mt-0.5 text-red-500" />
                          {exc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ===== Sticky pricing sidebar ===== */}
        <aside>
          <div className="card p-6 sticky top-20">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="block text-xs text-gray-400">Starting From</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{trek.price.toLocaleString("en-IN")}
                  <span className="text-sm font-normal text-gray-400">/per person</span>
                </span>
              </div>
              <span className="text-sm text-gray-500">{overview.duration || trek.duration}</span>
            </div>

            <div className="mt-5 space-y-2">
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <i className="bi bi-shield-check mt-0.5 text-primary" />
                Your Safety is Our Top Priority.
              </p>
            </div>

            <a href={site.whatsapp} target="_blank" rel="noreferrer" className="btn-primary w-full mt-5">
              Check Availability
            </a>
            <Link href="/contact" className="btn-dark w-full mt-3">Submit an Enquiry</Link>

            <p className="mt-4 flex items-start gap-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-ink/80">
              <i className="bi bi-info-circle mt-0.5" />
              Bonus Activity Included – Limited Time!
            </p>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Inclusions: Travel, Tea &amp; Breakfast, Lunch, Evening Snacks, Trek Charges &amp; more.
            </p>
          </div>
        </aside>
      </div>

      {/* ===== Carbon neutral + share strip ===== */}
      <section className="border-t border-line bg-white">
        <div className="container-px flex flex-wrap items-center justify-between gap-4 py-5">
          <span className="inline-flex items-center gap-2 text-sm text-gray-600">
            <img src={img("innerpages/icon/carbon-icon.svg")} alt="" className="h-5 w-5" />
            100% Carbon Neutral
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Share:</span>
            <a href={site.social.facebook} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink transition hover:bg-primary hover:text-white" aria-label="Share on Facebook">
              <i className="bx bxl-facebook" />
            </a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink transition hover:bg-primary hover:text-white" aria-label="Share on LinkedIn">
              <i className="bx bxl-linkedin" />
            </a>
            <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink transition hover:bg-primary hover:text-white" aria-label="Share on YouTube">
              <i className="bx bxl-youtube" />
            </a>
            <a href={site.social.instagram} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink transition hover:bg-primary hover:text-white" aria-label="Share on Instagram">
              <i className="bx bxl-instagram-alt" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}