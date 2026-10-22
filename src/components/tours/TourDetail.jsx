import Link from "next/link";
import Accordion from "@/components/treks/Accordion";
import TrekSectionNav from "@/components/treks/TrekSectionNav";
import TrekHeroSlider from "@/components/treks/TrekHeroSlider";
import DownloadItinerary from "@/components/treks/DownloadItinerary";
import { RoutePricingCard } from "@/components/treks/RoutePricingCards";

const rupees = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

function Fact({ icon, label, value }) {
  if (!value) return null;
  return (
    <li className="flex items-center gap-3">
      <span className="text-primary"><i className={`bi ${icon}`} /></span>
      <div className="content">
        <span className="mb-1.5 block text-sm text-gray-500">{label}</span>
        <strong className="block text-base font-medium text-ink">{value}</strong>
      </div>
    </li>
  );
}

// Tour detail in the same skin as the trek detail page: hero slider, pinned
// section nav, two-column sections and a sticky sidebar. Tour rows only carry
// title/type/duration/price/image/description, so the sections are built from
// those fields (with type-aware inclusions/FAQ). The sidebar keeps the tour's
// own pricing cards unchanged.
export default function TourDetail({ tour }) {
  const bookHref = `/book/${tour.slug}`;
  const isIntl = (tour.type || "").toLowerCase().includes("international");
  const nights = (() => {
    const m = /(\d+)\s*[Dd]\s*\/\s*(\d+)\s*[Nn]/.exec(tour.duration || "");
    return m ? Number(m[2]) : null;
  })();

  const inclusions = isIntl
    ? [
        "Return international flights on economy class",
        "Visa processing and travel insurance",
        "Hotel accommodation on twin-sharing basis",
        "Daily breakfast and select meals as per itinerary",
        "All transfers, intercity travel and sightseeing by coach",
        "English-speaking tour manager throughout the trip",
      ]
    : [
        "Accommodation on twin-sharing basis",
        "Daily breakfast and select meals as per itinerary",
        "All transfers and sightseeing by private vehicle",
        "Experienced trip leader / local guide",
        "All applicable tolls, parking and driver charges",
        "24×7 on-trip support from Alpha Adventures",
      ];

  const exclusions = isIntl
    ? [
        "Anything not mentioned under inclusions",
        "Personal expenses (laundry, tips, drinks, shopping)",
        "Optional activities and entrance fees not listed",
        "Single room supplement",
      ]
    : [
        "Airfare / train fare to the starting point",
        "Anything not mentioned under inclusions",
        "Personal expenses (laundry, tips, drinks, shopping)",
        "Optional activities and entrance fees not listed",
      ];

  const faqs = [
    {
      question: "What is the best time to take this tour?",
      answer: "This itinerary runs through most of the year. Our travel desk will confirm the ideal window for your chosen dates at the time of booking.",
    },
    {
      question: "Is this tour suitable for families and children?",
      answer: "Yes. The pace is relaxed and comfortable, and we can customise the itinerary for families travelling with children or senior citizens.",
    },
    {
      question: "Can the itinerary be customised?",
      answer: "Absolutely. Dates, group size, hotel category and add-on experiences can all be tailored. Talk to our travel desk for a bespoke plan.",
    },
    {
      question: "How do I confirm my booking?",
      answer: "Reserve online through the Book Now button, or reach us on WhatsApp / phone. A booking is confirmed once the advance payment is received.",
    },
  ];

  const sections = [];
  sections.push({
    id: "overview",
    label: "Overview",
    node: (
      <div className="package-info-wrap mb-0">
        <ul className="package-info-list grid grid-cols-1 gap-x-8 gap-y-8 rounded-[20px] border border-line/70 p-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          <Fact icon="bi-clock" label="Duration" value={tour.duration} />
          <Fact icon="bi-tag" label="Type" value={tour.type} />
          <Fact icon="bi-currency-rupee" label="Starting From" value={`${rupees(tour.price)} / person`} />
          {nights != null && <Fact icon="bi-moon-stars" label="Nights" value={`${nights} Night${nights > 1 ? "s" : ""}`} />}
        </ul>
      </div>
    ),
  });
  sections.push({
    id: "about",
    label: "About",
    node: (
      <div className="package-info-wrap">
        <div className="about-content">
          <p>{tour.description}</p>
          <p className="mt-4">
            This package includes accommodation, transport between sectors, guided sightseeing and daily meals as per
            the itinerary. Flights/trains to the base city are excluded unless mentioned. Customise the dates and group
            size with our travel desk.
          </p>
        </div>
      </div>
    ),
  });
  sections.push({
    id: "inclusions",
    label: "Inclusions",
    node: (
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h4 className="mb-4">What&apos;s Included</h4>
          <ul className="space-y-3">
            {inclusions.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-gray-600"><i className="bi bi-check-circle-fill mt-0.5 text-green-600" /> {t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-4">Not Included</h4>
          <ul className="space-y-3">
            {exclusions.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-gray-600"><i className="bi bi-x-circle-fill mt-0.5 text-red-500" /> {t}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  });
  if (tour.image) {
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
          <div className="row g-3">
            <div className="col-lg-6 col-md-6 col-12 gallery-item-col">
              <a className="gallery-item-card" data-fancybox="tour-gallery" href={tour.image} data-caption={tour.title} style={{ display: "block" }}>
                <img src={tour.image} alt={tour.title} className="gallery-img" />
                <div className="gallery-item-hover"><i className="bi bi-eye" /></div>
              </a>
            </div>
          </div>
        </div>
      ),
    });
  }
  sections.push({
    id: "faq",
    label: "FAQ",
    node: (
      <Accordion items={faqs.map((f) => ({
        title: <span className="font-semibold text-ink">{f.question}</span>,
        body: <p className="leading-relaxed">{f.answer}</p>,
      }))} />
    ),
  });

  return (
    <div className="trek-detail">
      {/* HERO BANNER — same self-contained slider skin as the trek page */}
      <div className="breadcrumb-section two" id="section-hero-slider" style={{ position: "relative", minHeight: "80svh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <TrekHeroSlider images={[tour.image].filter(Boolean)} title={tour.title} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(17,15,15,.25) 0%, rgba(17,15,15,.72) 100%)" }} />
        <div className="banner-content-wrap" style={{ position: "relative", width: "100%", paddingTop: 80 }}>
          <div className="container">
            <div className="banner-content" style={{ color: "#fff" }}>
              <nav style={{ marginBottom: 12, fontSize: 14, color: "rgba(255,255,255,.8)" }}>
                <Link href="/" style={{ color: "inherit" }}>Home</Link><span className="mx-2">›</span>
                <Link href="/tour-packages" style={{ color: "inherit" }}>Tour Packages</Link><span className="mx-2">›</span>
                <span style={{ color: "#fff" }}>{tour.title}</span>
              </nav>
              <h1 id="tour-title" style={{ color: "#fff", marginBottom: 10 }}>{tour.title}</h1>
              {(tour.type || tour.duration) && (
                <p style={{ color: "rgba(255,255,255,.85)", margin: 0 }}>
                  {[tour.type, tour.duration].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="package-details-page pt-100 mb-100">
        <div className="container">
          {/* SECTION NAV — full-width bar above the two-column row */}
          <TrekSectionNav
            sections={sections}
            trailing={<DownloadItinerary trek={{ ...tour, summary: tour.description }} itinerary={[]} />}
          />

          <div className="row g-lg-4 gy-5 justify-content-between">
            <div className="col-xl-8 col-lg-7">
              <div className="space-y-16">
                {sections.map((s) => (
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
                <div className="tour-sidebar">
                  {/* TRIP COST — sidebar pricing card */}
                  <div className="mt-4" id="section-tour-trip-cost">
                    <RoutePricingCard slug={tour.slug} bookHref={bookHref} variant="tour" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
