# Data Model

The content model lives in `src/data/*.js`. These modules are the equivalent of
tables. All are plain JS, imported at build time. Image URLs are produced by
`img()` from `src/lib/assets.js`.

## `treks.js` — the central content set
`export const treks = [...]` — one master list powering the homepage, all trek
listings, and dynamic detail pages. **Adding an object here makes it appear
everywhere automatically.**

Per-trek fields (from `src/data/treks.js`):
| Field | Type | Notes / used by |
|---|---|---|
| `slug` | string | URL id; unique key. Detail routes, `getTrekBySlug` |
| `title`, `location`, `state` | string | display; `state` = Region filter |
| `group` | enum | `sahyadri` \| `himalayan` \| `central` \| `backpacking` \| `near-nagpur` — drives listing membership |
| `tags` | string[] | e.g. `beginner, moderate, difficult, night, fort, weekend, monsoon, beach, desert, hill-station, heritage, high-altitude, half-day` — filters |
| `duration`, `price` (INR int), `badge` | | display |
| `image` | url | card/hero |
| `description` | string | display |
| `gallery` | url[] | optional; detail slider |
| `rating`, `reviewCount` | | optional |
| `about`, `overview`, `itinerary`, `inclusions`, `exclusions` | | optional rich detail (only fully populated for `seven-sisters-hill-trek`) |

`overview` object: `duration, difficulty, ageGroup, highestAltitude, basecamp,
accommodation, fitness`. `itinerary[]`: `{ day, title, description, slots:[{time,
activity}] }`.

Helpers & derived exports in the same file:
- `getTrekBySlug(slug)` — lookup.
- `popularTreks` — hardcoded slug subset for the homepage.
- `searchTreks`, `cabins` — homepage search widget lists (contain some
  placeholder/duplicate slugs — see [KNOWN_ISSUES.md](KNOWN_ISSUES.md)).
- `filterOptions` — `{ categories, regions, permits, visitors, forests }` static
  dropdown option lists (some options don't correspond to real treks).
- `trekGroups` — `{ title, blurb }` per group, used for listing headers.

## `tours.js`
`tourPackages[]`: `{ slug, title, type ("Domestic"|"International"), duration,
price (INR int), image, description }`. Helper `getTourBySlug`.

## `site.js`
- `site` — branding & contact: `name, logo, tagline, description, location,
  email, phone, whatsapp, rating, ratingNote, experience, social{}, paymentMethods[]`.
- `navLinks` — top nav; nested `children` render as mega-menu (up to 3 levels).
- `footerColumns`, `footerLegal`, `copyright`.
> Note: several `navLinks`/`footerColumns` hrefs point to routes that don't have
> a dedicated `page.jsx` and fall through to the `[...slug]` placeholder (e.g.
> `/treks/upcoming-treks/weekend-treks` resolves, but deep backpacking sub-slugs,
> `/trek-calendar`, `/corporate-treks`, `/privacy-policy`, `/trek-disclaimer` do
> not have real pages). See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## `gallery-details.js` + `lib/galleryDetailHtml.js`
`galleryPages[]` (one per gallery slug) with `{ slug, title, hero, heroAlt,
seasons[] }`. Each `season`: `{ id (summer|monsoon|winter|spring), label, icon,
sub, images:[{src, alt}] }`. `VISIBLE_INITIAL` controls how many images show
before "View All". `galleryDetailHtml(page)` renders this to the legacy HTML
string. `gallerySlugSet`, `getGalleryPage` are lookups. `gallery/[slug]` sets
`dynamicParams = false` — only these slugs build.

## `gallery.js`, `stories.js`, `testimonials.js`, `reasons.js`
Homepage content arrays (gallery thumbnails, trek stories, testimonials, "why
us" reasons). Consumed by the matching `src/components/home/*` component.

## Relationships (how data connects)
```
treks[]  ──slug──►  /treks/[slug]            (TrekDetail)
         ──group──► /treks/upcoming-treks/[group], /treks/upcoming-treks (sections)
         ──group=near-nagpur──► /trips-near-nagpur/detail/[slug] (TripDetail)
         ──popularTreks/searchTreks/cabins──► homepage widgets
tourPackages[] ──slug──► /tour-packages/[slug]
galleryPages[] ──slug──► /gallery/[slug]  (dynamicParams=false)
site.navLinks/footer ──► SiteHeader/Footer & React nav
```

## Lifecycle
Static — no create/update/delete at runtime. "Migrations" = git commits editing
these files. No cascading, no constraints beyond slug uniqueness (enforced only
by convention / `find` returning the first match).
