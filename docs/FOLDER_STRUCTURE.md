# Folder Structure

```
alnew/
├── CLAUDE.md               # AI/dev operating manual
├── docs/                   # this knowledge base
├── next.config.mjs         # asset proxy rewrites + remote image host
├── middleware.js source → src/middleware.js
├── tailwind.config.js      # design tokens
├── postcss.config.js
├── jsconfig.json           # @/* → src/*, JS config
├── .claude/launch.json     # dev-server launch config (npm run dev, port 3000)
├── public/css/             # a few local CSS files (most CSS is proxied)
├── harishchandragad-gallery.html   # loose reference HTML (not routed)
├── *.log                   # committed dev logs — noise, gitignored going forward
└── src/
    ├── app/                # App Router routes (one page.jsx per route)
    ├── components/
    ├── data/               # CONTENT SOURCE OF TRUTH
    ├── lib/
    └── middleware.js
```

## `src/app/` — routes
Each folder with `page.jsx` is a route. Dynamic segments in `[brackets]`.
See [ROUTES.md](ROUTES.md) for the full route table. Notable:
- `[...slug]/page.jsx` — catch-all placeholder for any unmatched path.
- `not-found.jsx` — 404 page.
- `layout.jsx` — global shell (head, header, footer, template scripts).

## `src/components/`
- `home/**` — homepage sections: `Hero, SearchWidgets, About, Stats, WhyUs,
  TrekGrid, TourPackages, Gallery, Testimonials, TrekStories, Partners`.
- `treks/**` — `TrekDetail, TripDetail, TrekGroupSections, PhotoGallerySlider,
  BackpackingTripsClient`.
- `ui/**` — reusable atoms: `SectionHeading, TourCard, TrekCard`.
- `layout/**` — `SiteHeader, SiteFooter, Navbar, Footer, PageHero`.
  (`SiteHeader/SiteFooter` inject legacy HTML; `Navbar/Footer/PageHero` are React.)
- `*Scripts.jsx` — client components that run a page's legacy jQuery init:
  `TemplateScripts` (global) plus per-page `About/Dashboard/Gallery/GalleryDetail/
  Shop/TravelCalendar/TrekDetail/SafetyGuidelines/ResponsibleTravel/
  PackingChecklist/FitnessRequirements/BeginnerTrekGuide`.

## `src/data/` — content
- **Structured data (Pattern A):** `site.js` (branding/nav/footer), `treks.js`,
  `tours.js`, `gallery.js`, `gallery-details.js`, `stories.js`,
  `testimonials.js`, `reasons.js`, plus trek-detail data files.
- **Verbatim legacy bodies (Pattern B):** `orig-*.html` (page bodies) +
  `*-init.js` (that page's jQuery init as a string) + a few `*.css` snippets.
- See [DATA_MODEL.md](DATA_MODEL.md) for shapes.

## `src/lib/`
- `assets.js` — `IMG_BASE` + `img(path)` helper (the only place the CDN host
  should appear).
- `galleryDetailHtml.js` — builds gallery-detail HTML from season data.

## Where does a new thing go?
| Adding… | Put it in |
|---|---|
| A trek/trip | object in `src/data/treks.js` |
| A tour package | object in `src/data/tours.js` |
| A reusable card/atom | `src/components/ui/` |
| A homepage section | `src/components/home/` + wire into `src/app/page.jsx` |
| A new React route | `src/app/<kebab>/page.jsx` |
| A legacy-HTML page | `orig-*.html` + `*-init.js` + `*Scripts.jsx`, Pattern B |
| Branding/nav/contact | `src/data/site.js` |
