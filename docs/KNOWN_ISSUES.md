# Known Issues

Real issues, kept current. Resolved items are marked so history stays readable.

## 1. Hard dependency on external asset domain — RESOLVED
- **Was:** all CSS/JS/images/video loaded from `alpha.thegreyhawks.com` at
  runtime, so the site broke if that domain was down.
- **Now:** assets are self-hosted under `public/assets`; `IMG_BASE = "/assets/img"`
  in `src/lib/assets.js`. `next.config.mjs` still lists the domain as a
  `next/image` remote pattern (harmless allowlist) and holds legacy redirects.
- **Status:** resolved (commit `d089984`).

## 2. Duplicate hardcoded asset base (LOW)
- **Problem:** `components/treks/BackpackingTripsClient.jsx:38` redefines
  `IMG_BASE = "/assets/img"` instead of importing `img()`/`IMG_BASE` from
  `src/lib/assets.js`.
- **Impact:** two places to change if the base moves.
- **Direction:** import from `@/lib/assets`.
- **Status:** open (cosmetic; no longer a CDN-host risk).

## 3. Nav/footer links to non-existent routes (MEDIUM)
- **Problem:** some `navLinks`/`footerColumns` hrefs in `src/data/site.js` may
  still fall through to the `[...slug]` placeholder.
- **Direction:** fix hrefs to real routes or create the pages.
- **Status:** open — NEEDS VERIFICATION against current routes/redirects.

## 4. Placeholder / duplicate static data (MEDIUM)
- **Problem:** some `searchTreks`/`cabins`/`filterOptions` entries in `treks.js`
  and `site.social` URLs may be placeholders or point to the wrong slug.
- **Direction:** reconcile with real inventory before launch.
- **Status:** open — NEEDS VERIFICATION with the client.

## 5. Thin dynamic detail data for some treks (LOW)
- **Problem:** a few treks render via `TripDetail` with only base fields (no
  itinerary/inclusions).
- **Status:** open (content gap).

## 6. Admin backend (SCOPE) — PARTIALLY RESOLVED
- **Now:** `/admin` is wired to Supabase (read-only) behind an admin/staff gate
  (`src/app/admin/data.ts`, `requireAdmin()`): live bookings, leads, payments,
  customers, departures, KPIs and charts.
- **Still open:** the create/edit modals (add booking/trek/departure), gallery
  uploads, and the catalog screens (treks/tours/content) mutate **local state
  only** — not persisted to the DB. Treks have no `price` column yet, so that
  screen stays static. Settings are not saved.
- **Direction:** back the write actions with Server Actions + tables (catalog
  CRUD phase).
- **Status:** partially resolved.

## 7. Legacy libs unpinned & unbundled (LOW/MED)
- **Problem:** jQuery/Bootstrap/GSAP for Pattern B pages are not version-locked
  in `package.json`; no SRI.
- **Status:** open.

## 8. Repo hygiene (LOW)
- Stray `*.log` dev files in the working tree (gitignored). Loose
  `harishchandragad-gallery.html` is a tracked, unrouted file.
- **Status:** cosmetic.

## 9. Lint deps missing (LOW) — RESOLVED
- `eslint` + `eslint-config-next` are in `devDependencies`; `npm run lint`,
  `typecheck`, `test`, `test:e2e` all exist.
- **Status:** resolved.

## 10. Payment is mocked (HIGH — pre-launch blocker)
- **Problem:** booking confirmation uses `confirmMockPayment`
  (`src/domain/booking/service.ts`); there is no real payment capture.
- **Direction:** implement PhonePe with a server-verified Route Handler callback
  (signature verify, idempotency, no oversell). Highest-risk phase — do TDD in
  sandbox.
- **Status:** open.

## 11. Email deliverability depends on Brevo config (MED)
- **Problem:** transactional email goes through the Brevo HTTP API
  (`src/lib/mailer.ts`), falling back to SMTP. Deliverability needs the sending
  domain authenticated (DKIM/SPF/DMARC) and Brevo's **authorised-IP restriction
  turned off** (serverless IPs rotate). Free tier is ~300 emails/day.
- **Direction:** keep DNS auth green; monitor volume; watch the sender domain's
  reputation.
- **Status:** open (operational).

## 12. Incremental TypeScript migration (LOW)
- **Problem:** `.ts/.tsx` and legacy `.js/.jsx` coexist under `allowJs`.
- **Direction:** migrate files to TS as they're touched.
- **Status:** open (by design).
