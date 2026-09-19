# V1 Current-State Report — Alpha Adventures

> Audit date: 2026-09-19. Every claim is tagged **[CURRENT]** (confirmed from
> code), **[PROPOSED]** (V2 recommendation — not in this doc's scope), or
> **[NEEDS VERIFICATION]** (cannot be confirmed from the repo alone).
> This report describes **what exists today**. For the target system see
> [V2_PROPOSAL.md](V2_PROPOSAL.md) and [V2_MASTER_PLAN.md](V2_MASTER_PLAN.md).

---

## V1.1 Executive Summary

**What it is [CURRENT].** A marketing website for Alpha Adventures, a trekking &
travel agency in Nagpur, Maharashtra. It is a **static, content-first Next.js 14
(App Router) rebuild** of a live PHP site at `alpha.thegreyhawks.com`. It is a
brochure site: it presents treks, tours, guides and policies. It does not
transact.

**Current stack [CURRENT].** Next.js `^14.2.35`, React `18.3.1`, Tailwind
`3.4.14`, plain JavaScript (JSX, no TypeScript). Three runtime dependencies
only (`next`, `react`, `react-dom`). All CSS/JS/images/video are **hot-linked
from the live PHP domain** (`alpha.thegreyhawks.com`) via `next.config.mjs`
rewrites and `src/lib/assets.js`; the legacy jQuery/Bootstrap/GSAP template
runtime is loaded from that domain at runtime, not bundled.

**Maturity [CURRENT].** Front-end presentation layer is largely complete and
visually faithful. There is **no application layer**: no database, no
authentication, no API routes, no server actions, no payment, no email, no
persistence of any kind.

**Working today [CURRENT].**
- Homepage, trek/tour listing and detail pages rendered from JS data (Pattern A).
- ~20 legacy pages rendered by injecting verbatim HTML + re-running jQuery init
  (Pattern B).
- Per-route `metadata` (title + description) on nearly every page.
- Legacy `.php` gallery URL rewrite via middleware.
- Static filtering/search widgets driven by hardcoded arrays.

**Incomplete / missing [CURRENT].**
- Booking flow, payment, email confirmation — **absent**.
- User accounts / dashboard — a **static HTML mock** at `/user-dashboard`, not
  authenticated, no session.
- Contact form — **submits nowhere**; `onsubmit` shows a JS `alert()` and resets.
- Admin/CMS backend — **absent**; all content edited in source code.
- Blog, shop cart, colleges/corporate lead capture — presentational only.
- Sitemap, robots.txt, structured data, canonical/OG/Twitter tags — **absent**.

**Major architectural limitations [CURRENT].**
1. Content is hardcoded in `src/data/*.js` and `orig-*.html`; every change is a
   code edit + redeploy.
2. Hard runtime dependency on the external asset domain — if it is down or moves
   assets, the rebuilt site breaks.
3. Two coupled rendering patterns; Pattern B markup and its init scripts are
   linked by CSS classes/IDs and break each other if edited carelessly.
4. No type safety (plain JS), no tests, no CI.

**Major technical risks [CURRENT].**
- **Availability:** external-asset dependency is a single point of failure.
- **Data loss:** the contact form discards every enquiry. Any lead submitted
  today is lost.
- **Supply chain:** legacy libs are unpinned, unbundled, no SRI — whatever the
  live domain serves.
- **Scope gap:** client proposal expected admin backend + booking + payment +
  auth per feature; none exist.

**Major missing systems [CURRENT]:** database, auth/authorization, admin/CMS,
payments (PhonePe), transactional email (Resend), lead persistence, media
management, dynamic SEO, testing, observability.

---

## V1.2 Page & Route Inventory

Source: `src/app/**/page.jsx`. Pattern **A** = React/data-driven, **B** =
verbatim legacy HTML injection. All routes are **public / no auth [CURRENT]**.

| Route | Pattern | Purpose | Status | Dynamic? | Data Source | Auth |
|---|---|---|---|---|---|---|
| `/` | A | Homepage | Complete | Semi (build-time data) | `treks.js`, `tours.js`, `stories/testimonials/reasons/gallery` | No |
| `/about-us` | B | Why Us | Complete | Static | `orig-about-us.html` | No |
| `/contact` | B | Contact/enquiry | **Incomplete** (form dead-ends) | Static | `orig-contact.html` | No |
| `/shop` | B | Merch | Placeholder (no cart) | Static | `orig-shop.html` | No |
| `/corporate-programmes` | B | Corporate | Complete (presentational) | Static | `orig-corporate-programmes.html` | No |
| `/student-programmes` | B | Colleges/students | Complete (presentational) | Static | `orig-student-programmes.html` | No |
| `/travel-calendar` | B | Trek calendar | Complete | Static | `orig-travel-calendar.html` | No |
| `/beginner-trek-guide` | B | Guide | Complete | Static | `orig-beginner-trek-guide.html` | No |
| `/fitness-requirements` | B | Guide | Complete | Static | `orig-fitness-requirements.html` | No |
| `/packing-checklist` | B | Guide | Complete | Static | `orig-packing-checklist.html` | No |
| `/responsible-travel` | B | Policy | Complete | Static | `orig-responsible-travel.html` | No |
| `/safety-guidelines` | B | Policy | Complete | Static | `orig-safety-guidelines.html` | No |
| `/cancellation-policy` | B | Policy | Complete | Static | `orig-cancellation-policy.html` | No |
| `/terms-and-conditions` | B | Policy | Complete | Static | `orig-terms-and-conditions.html` | No |
| `/user-dashboard` | B | **Mock** dashboard | Placeholder | Static | `orig-dashboard.html` | **No (fake)** |
| `/gallery` | B | Gallery landing | Complete | Static | `orig-gallery.html` | No |
| `/gallery/[slug]` | B | Seasonal gallery | Complete | Semi (`dynamicParams=false`) | `gallery-details.js` → `galleryDetailHtml()` | No |
| `/tour-packages` | A | Tour list | Complete | Semi | `tours.js` | No |
| `/tour-packages/[slug]` | A | Tour detail | Complete | Semi (`generateStaticParams`) | `getTourBySlug` | No |
| `/treks/upcoming-treks` | A | Grouped treks | Complete | Semi | `treks.js`, `trekGroups` | No |
| `/treks/upcoming-treks/[group]` | A | Treks by group | Complete | Semi | `treks.js` | No |
| `/treks/backpacking-trips` | A | Backpacking list | Complete | Semi (client cmp) | `treks.js` | No |
| `/treks/trips-near-nagpur` | A | Near-Nagpur list | Complete | Semi | `treks.js` | No |
| `/treks/[slug]` | A | Trek detail | Complete | Semi (`generateStaticParams`) | `getTrekBySlug` | No |
| `/trips-near-nagpur/detail/[slug]` | A | Trip detail | **Thin** (base fields only) | Semi | `getTrekBySlug` | No |
| `/trips-near-nagpur/detail/seven-sisters-hill-trek` | B | Flagship trip | Complete | Static | `orig-trek-detail-seven-sisters.html` | No |
| `/backpacking-trips/detail/spiti-backpacking-trip` | B | Flagship backpacking | Complete | Static | `orig-trek-detail-spiti.html` | No |
| `/[...slug]` | A | **Catch-all placeholder** | Placeholder | N/A | none | No |
| `not-found` | A | 404 | Complete | N/A | none | No |

**Classification summary:** Static ≈ 18 · Semi-dynamic (build-time data) ≈ 9 ·
Fully dynamic (runtime data) = **0** · Placeholder = 3 (`/shop`,
`/user-dashboard`, `/[...slug]`) · Incomplete = 1 (`/contact`).

**Legacy rewrite [CURRENT]:** middleware maps `/gallery-detail.php?slug=<known>`
→ `/gallery/<slug>` (matcher scoped to `/gallery-detail.php` only).

---

## V1.3 Feature Inventory

| Feature | Implementation | Frontend | Backend | DB dep. | Admin dep. | External | Missing |
|---|---|---|---|---|---|---|---|
| Homepage & nav | Pattern A + `site.js` nav | ✅ | — | — | — | assets domain | admin-editable nav |
| Treks listing | `treks.js` array | ✅ | — | — | — | — | runtime data source |
| Filter & search | hardcoded `searchTreks`/`filterOptions` | ✅ (client) | — | — | — | — | real query; some slugs mis-point |
| Trek/trip detail | `getTrekBySlug` (A) + 2 flagship (B) | ✅ | — | — | — | — | full detail for thin trips |
| Tour packages | `tours.js` | ✅ | — | — | — | — | runtime data |
| Booking flow | **none** | ❌ | ❌ | ❌ | ❌ | — | entire flow |
| Payment | **none** | ❌ | ❌ | ❌ | ❌ | PhonePe (not integrated) | entire flow |
| Enquiry confirmation email | **none** | ❌ | ❌ | ❌ | ❌ | Resend (not integrated) | entire flow |
| User accounts / dashboard | static mock (`orig-dashboard.html`) | ⚠️ mock | ❌ | ❌ | ❌ | — | auth, session, real data |
| Contact form | legacy markup, `alert()` onsubmit | ⚠️ | ❌ | ❌ | ❌ | mailto/WhatsApp links | persistence, notify |
| Shop | static markup | ⚠️ | ❌ | ❌ | ❌ | — | cart, checkout |
| Blog / content | **none** | ❌ | ❌ | ❌ | ❌ | — | entire system |
| Gallery | Pattern B + `gallery-details.js` | ✅ | — | — | — | assets domain | admin uploads |
| Testimonials | `testimonials.js` | ✅ | — | — | — | — | admin CRUD |
| Corporate / student | Pattern B pages | ✅ | — | — | — | — | lead capture |
| Trust/credibility | `reasons.js`, stats | ✅ | — | — | — | — | — |
| Legal/policy pages | Pattern B | ✅ | — | — | — | — | admin-editable |
| SEO | per-route title/description | ⚠️ partial | — | — | — | — | sitemap/robots/OG/schema |
| Admin dashboard | **none** | ❌ | ❌ | ❌ | ❌ | — | entire system |

---

## V1.4 Current Data Architecture

**CURRENT.**
- **Data models:** plain JS arrays/objects in `src/data/*.js`, imported at build
  time. No schema, no validation, no runtime store.
  - `treks.js` — `treks[]` (fields: `slug, title, location, state, group,
    tags[], duration, price` (INR int)`, badge, image, gallery[]?, description`,
    plus optional detail fields on some entries). Helpers: `getTrekBySlug`,
    `popularTreks`, `searchTreks`, `cabins`, `filterOptions`, `trekGroups`.
  - `tours.js` — `tourPackages[]` (`slug, title, type, duration, price, image,
    description`) + `getTourBySlug`.
  - `site.js` — `site` (branding/contact/social/payment icons), `navLinks`,
    `footerColumns`, `footerLegal`, `copyright`.
  - `testimonials.js`, `stories.js`, `reasons.js`, `gallery.js`,
    `gallery-details.js`.
  - `orig-*.html` (~24 files) — verbatim legacy page bodies + matching
    `*-init.js` jQuery init strings for Pattern B.
- **Supabase usage:** **none** (verified — no client, no import).
- **API calls / server fetching / client fetching:** **none** (verified — no
  `fetch(`, no `process.env`, no API routes).
- **Data fetching pattern:** static import → render → static export.

**Missing database models [CURRENT gap]:** treks, tours, categories, bookings,
payments, orders, users, leads/enquiries, blog posts, testimonials (as records),
gallery/media, site settings, navigation, SEO metadata. See
[V2_PROPOSAL.md](V2_PROPOSAL.md#supabase-architecture) and
[DYNAMIC_CONTENT_AUDIT.md](DYNAMIC_CONTENT_AUDIT.md) for **[PROPOSED]** models.

---

## V1.5 Current Authentication

**CURRENT: none exists.**
- No login, no signup, no session handling, no roles, no permissions.
- No protected routes — every route is anonymous.
- `src/middleware.js` exists but only rewrites a legacy `.php` gallery URL; it
  performs **no auth**.
- `/user-dashboard` is a **static HTML mock** injected via
  `dangerouslySetInnerHTML`; it does not represent a real authenticated area and
  reads no user data.

**Missing:** the entire authentication and authorization stack. See
[AUTHENTICATION.md](AUTHENTICATION.md) (existing) and V2 proposal.

---

## V1.6 Current Payments

**CURRENT: none exists.**
- No payment code, no provider SDK, no order/payment state, no webhooks.
- `site.paymentMethods` in `site.js` is a list of **image icons** (Visa/MC/GPay/
  PayPal) for display only — not an integration.
- **PhonePe is NOT integrated [CURRENT].**
- Booking = WhatsApp / phone / contact redirect, not a transaction.

**Missing:** order creation, payment request, callback/webhook verification,
payment state persistence, reconciliation, failure handling, refunds.

---

## V1.7 Current Email

**CURRENT: none exists.**
- No email provider, no transactional email, no templates, no notifications.
- Contact form `onsubmit="event.preventDefault(); alert('Thank you...');
  this.reset();"` — **no send, no persistence; the enquiry is discarded.**
- `mailto:info@alphaadventures.in` and `wa.me/918180001597` links are the only
  contact channels, and they rely on the visitor's own mail/WhatsApp client.
- **Resend is NOT integrated [CURRENT].**

**Missing:** every transactional workflow (enquiry notification/confirmation,
booking/payment confirmation, account emails, admin alerts).

---

## V1.8 SEO

| Item | Status [CURRENT] |
|---|---|
| Title metadata | ✅ present on nearly all pages (`metadata`/root `template` `%s \| Alpha Adventures`) |
| Meta description | ✅ present on most pages |
| Canonical URLs | ❌ none (`alternates.canonical` not used anywhere) |
| Open Graph | ❌ none |
| Twitter/X cards | ❌ none |
| Structured data (JSON-LD) | ❌ none |
| Sitemap | ❌ none (`app/sitemap.*` absent, `public/sitemap.xml` absent) |
| robots.txt | ❌ none |
| Dynamic metadata | ⚠️ partial — `generateMetadata` not confirmed on `[slug]` detail routes; static `metadata` dominates |
| Image SEO / alt | ⚠️ inherited from legacy markup; not systematic |
| Internal linking | ⚠️ several nav/footer links point to non-existent routes → catch-all placeholder |
| Content architecture | brochure; no blog/topical structure |

Net: **basic title/description only.** No discoverability layer.

---

## V1.9 Performance

Measurements: **NOT MEASURED** (no benchmarks run in this audit).

Structural observations [CURRENT]:
- **Large legacy CSS/JS bundle** (Bootstrap, jQuery, jQuery-UI, Fancybox,
  Swiper, Slick, GSAP, daterangepicker, boxicons) loaded at **runtime from the
  external domain** — 13 stylesheets in `layout.jsx` head alone, plus scripts.
- **Images hot-linked** from the CDN via `img()`; Next.js `<Image>` optimization
  is **not** used for these (remote domain allow-listed but components use raw
  URLs / legacy `<img>`).
- **Server rendering:** pages are server components by default and statically
  generated; good baseline. A few client components (`SearchWidgets`,
  `BackpackingTripsClient`, all `*Scripts.jsx`) ship JS.
- **DB/API calls:** none (all build-time) — zero runtime data latency, but zero
  freshness.
- **Bundle risk:** unbundled legacy libs; no tree-shaking, no version pinning.

---

## V1.10 Security

| Concern | Status [CURRENT] |
|---|---|
| Exposed secrets | None in repo (no secrets exist because no backend exists). `.gitignore` covers `.env*` |
| `dangerouslySetInnerHTML` | Used for all Pattern B pages + `galleryDetailHtml()`. **Safe only because HTML is static & author-controlled.** No user input flows in |
| Auth weaknesses | N/A — no auth exists |
| Authorization gaps | N/A — no protected resources exist |
| Unsafe API endpoints | None — no API exists |
| Input validation | **None** — the one form doesn't submit; no server input anywhere |
| Unsafe DB access | N/A — no DB |
| Client-side secrets | None |
| Insecure admin | N/A — no admin exists |
| Payment security | N/A — no payments; **but a major future concern** (see V2) |
| Supply chain | ⚠️ legacy libs unpinned/unbundled, no SRI, served by third-party domain |

The only present risk class is **supply-chain / availability** via the external
asset domain. The `dangerouslySetInnerHTML` usage is currently safe **and must
stay author-controlled** — never feed user input, query params, or fetched
content into those paths (see [SECURITY.md](SECURITY.md)).

---

## V1.11 Code Quality

- **Architecture [CURRENT]:** clean separation for Pattern A (data → components →
  routes). Pattern B is a pragmatic but brittle verbatim-injection bridge to the
  legacy template. Two patterns coexisting raises the learning curve.
- **Duplication:** `IMG_BASE` redefined in `BackpackingTripsClient.jsx` instead
  of importing `img()`. Some duplicate/placeholder data in `searchTreks`/`cabins`
  (slugs point to the wrong trek); `filterOptions` overstates coverage.
- **Naming:** consistent — PascalCase components, kebab-case data/routes.
- **Component organization:** reasonable (`home/`, `treks/`, `ui/`, `layout/`).
- **Maintainability:** content-in-code means non-developers cannot edit;
  Pattern B markup/init coupling is fragile.
- **TypeScript quality:** N/A — plain JS, no type safety.
- **Error handling:** `not-found.jsx`; dynamic routes call `notFound()` for
  unknown slugs; script loader swallows load errors. No error boundaries for
  runtime failures (none needed yet — nothing runs at runtime).
- **Testing:** **none** — no framework, no tests, no CI.
- **Technical debt:** external-asset dependency; dead-end contact form;
  non-existent-route links; thin trip data; unpinned legacy libs; stray `*.log`
  files; loose untracked `harishchandragad-gallery.html`; `next lint` may lack
  eslint deps. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

---

## Bottom line

V1 is a **faithful, mostly-complete static brochure front-end** with **zero
application backend**. Everything the client proposal called "admin-managed",
"booking", "payment", "account", or "confirmation" is **not built**. The site
also **actively loses leads today** (dead contact form) and **depends on an
external domain to render**. These are the two issues to fix first regardless of
the larger V2 build. Continue to [V2_MASTER_PLAN.md](V2_MASTER_PLAN.md).
