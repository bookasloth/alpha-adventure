# Known Issues

Real issues found during the audit. Not fictional.

## 1. Hard dependency on external asset domain (HIGH)
- **Problem:** all CSS/JS/images/video load from `alpha.thegreyhawks.com` at
  runtime (proxy rewrites + `img()` + hardcoded Hero video). The rebuilt site
  cannot render correctly if that domain is down or its asset paths change.
- **Impact:** styling/scripts/images break in prod and dev.
- **Files:** `next.config.mjs`, `src/lib/assets.js`, `components/home/Hero.jsx:12`,
  `layout.jsx`, `TemplateScripts.jsx`.
- **Direction:** self-host assets in `public/`, flip `IMG_BASE` to `/assets/img`,
  remove rewrites, update Hero video.
- **Status:** open / by-design-for-now.

## 2. Duplicate hardcoded asset host (LOW)
- **Problem:** `components/treks/BackpackingTripsClient.jsx:38` redefines
  `IMG_BASE` instead of importing `img()` from `src/lib/assets.js`.
- **Impact:** two places to change the CDN host; easy to miss one.
- **Direction:** import from `@/lib/assets`.
- **Status:** open.

## 3. Nav/footer links to non-existent routes (MEDIUM)
- **Problem:** several `navLinks`/`footerColumns` hrefs in `src/data/site.js`
  have no dedicated `page.jsx` and fall through to the `[...slug]` placeholder,
  e.g. `/trek-calendar` (real page is `/travel-calendar`), `/corporate-treks`,
  `/privacy-policy`, `/trek-disclaimer`, and deep backpacking sub-slugs like
  `/treks/backpacking-trips/maharashtra/malvan-tarkarli`.
- **Impact:** users land on a generic "page ready for content" screen, not real
  content or a 404.
- **Files:** `src/data/site.js`, `src/app/[...slug]/page.jsx`.
- **Direction:** fix hrefs to real routes or create the pages.
- **Status:** open.

## 4. Placeholder / duplicate data (MEDIUM)
- **Problem:** `searchTreks` and `cabins` in `treks.js` contain entries whose
  `slug` points to a different trek (e.g. "Alang Madan Kulang" →
  `rajgad-fort-trek`; several cabins → `rajgad-fort-trek`). `filterOptions`
  lists regions/permits/forests that don't map to real treks. `site.social`
  URLs are bare domain placeholders.
- **Impact:** search/cabin clicks lead to the wrong detail page; filters overstate
  coverage; social links go nowhere useful.
- **Direction:** reconcile with real inventory before launch.
- **Status:** open — NEEDS VERIFICATION with the client.

## 5. Thin `near-nagpur` dynamic detail data (LOW)
- **Problem:** only `seven-sisters-hill-trek` has full detail (its own Pattern B
  route). `silver-falls` / `karwaan-camping` render via `TripDetail` with only
  base fields (no itinerary/inclusions).
- **Files:** `treks.js`, `components/treks/TripDetail.jsx`.
- **Status:** open (content gap).

## 6. No admin backend (SCOPE)
- **Problem:** the client scope expected UX **plus an admin backend** per
  feature; this repo is front-end only. Content is edited in code, not a UI.
- **Direction:** if required, introduce a CMS/DB behind the `src/data/*` helper
  shapes (see [DATABASE.md](DATABASE.md), [DECISIONS.md](DECISIONS.md)).
- **Status:** open / out of current repo scope.

## 7. Legacy libs unpinned & unbundled (LOW/MED)
- **Problem:** jQuery/Bootstrap/GSAP/etc. are whatever the live domain serves;
  not in `package.json`, no version lock, no SRI.
- **Impact:** upstream changes can silently break the site; supply-chain risk.
- **Status:** open.

## 8. Repo hygiene (LOW)
- Stray `*.log` dev files in the working tree (gitignored, untracked — safe to
  delete). `harishchandragad-gallery.html` is a tracked loose file, not routed.
- **Status:** cosmetic.

## 9. Lint deps possibly missing (LOW)
- `next lint` has no `eslint`/`eslint-config-next` in devDeps; first run may
  prompt to install. NEEDS VERIFICATION. See [TESTING.md](TESTING.md).
