# Features

All features serve one **anonymous visitor** type. Entry points are nav/footer
(`src/data/site.js`) and the homepage.

## Homepage
- **User type:** visitor. **Entry:** `/`.
- **Flow:** hero (video from live domain) → search widget → about/stats/why-us →
  trek grid (`popularTreks`) → tour packages → gallery → testimonials → stories
  → partners.
- **Files:** `src/app/page.jsx`, `src/components/home/*`.
- **Rules:** homepage trek grid is the hardcoded `popularTreks` subset; search
  widget filters `searchTreks` client-side only (no submit).

## Trek discovery & detail
- **Entry:** nav "Upcoming Treks", "Backpacking Trips", "Trips Near Nagpur";
  homepage grid.
- **Flow:** listing (grouped/filtered from `treks[]`) → `/treks/[slug]` detail.
- **Files:** `treks/upcoming-treks/**`, `treks/backpacking-trips`,
  `treks/trips-near-nagpur`, `components/treks/TrekDetail.jsx`, `TrekGrid.jsx`,
  `TrekGroupSections.jsx`, `ui/TrekCard.jsx`.
- **Rules:** membership by `group`; filters by `tags`/`state`. See
  [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md).
- **Dependency:** `src/data/treks.js`.

## Trips Near Nagpur
- Detail via dynamic `TripDetail` **except** `seven-sisters-hill-trek`, which is
  a hand-built legacy page. `silver-falls`, `karwaan-camping` use the dynamic
  route (with limited data → mostly the base fields).

## Tour packages
- **Entry:** nav "Tour Packages". **Flow:** `/tour-packages` list →
  `/tour-packages/[slug]`. Detail CTA = WhatsApp enquire + contact link.
- **Files:** `tour-packages/**`, `components/home/TourPackages.jsx`,
  `ui/TourCard.jsx`. **Data:** `src/data/tours.js`.

## Gallery
- **Entry:** nav/footer. **Flow:** `/gallery` landing → `/gallery/[slug]`
  seasonal gallery with tabs (summer/monsoon/winter/spring), lazy "View All",
  and a lightbox.
- **Files:** `gallery/page.jsx`, `gallery/[slug]/page.jsx`,
  `lib/galleryDetailHtml.js`, `components/GalleryDetailScripts.jsx`.
- **Data:** `src/data/gallery-details.js` (+ `gallery.js` for homepage/landing).
- **Rule:** `dynamicParams=false`; only listed slugs build.

## Informational / policy pages
Guides (beginner, fitness, packing), programmes (corporate, student), policies
(safety, responsible travel, cancellation, terms), calendar, shop, contact,
about — all **Pattern B** (verbatim legacy HTML). Edit the `orig-*.html`.

## Global chrome
Header (topbar + mega-menu nav), footer, magic cursor, scroll effects — legacy
HTML + `TemplateScripts` runtime. See [UI_SYSTEM.md](UI_SYSTEM.md).

## SEO
Per-route `metadata`/`generateMetadata`; global title template
`%s | Alpha Adventures` and description from `site.js` (`src/app/layout.jsx`).
No `sitemap.xml`/`robots.txt`/structured data yet (candidate future work).

## Not present (commonly assumed, absent here)
Accounts/login, cart/checkout, payments, live availability, reviews submission,
search backend, notifications, admin CRUD. See
[BUSINESS_LOGIC.md](BUSINESS_LOGIC.md).
