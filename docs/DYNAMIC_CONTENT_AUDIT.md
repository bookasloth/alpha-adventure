# Dynamic Content Audit — Alpha Adventures

> Goal: decide, per content block, whether it should stay static, become
> database-driven, be admin-managed, user-generated, auto-generated, or come
> from an external integration. **Current Source** is **[CURRENT]** (confirmed
> from code). Everything in the other columns is **[PROPOSED]** for V2.
> Companion to [V1_REPORT.md](V1_REPORT.md) and [V2_PROPOSAL.md](V2_PROPOSAL.md).

## Legend
- **Should be dynamic?** = should content change without a code deploy.
- **Priority:** P0 (before production) · P1 (important) · P2 (useful) · P3 (later).
- **Admin editable?** = a non-developer can change it in the admin UI.

| Content | Current Source [CURRENT] | Should be dynamic? | DB model [PROPOSED] | Admin editable? | Priority |
|---|---|---|---|---|---|
| Hero (headline, subcopy, video) | `Hero.jsx` + `site.js` hardcoded | Yes | `site_settings` / `page_sections` | Yes | P1 |
| Site branding (name, logo, tagline) | `site.js` | Yes | `site_settings` | Yes | P1 |
| Contact info (phone, email, WhatsApp, address) | `site.js` | Yes | `site_settings` | Yes | **P0** |
| Social links | `site.js` (placeholder URLs) | Yes | `site_settings` | Yes | P2 |
| Navigation (mega-menu) | `site.js` `navLinks` | Yes | `navigation` (self-referencing) | Yes | P1 |
| Footer columns / legal | `site.js` `footerColumns/footerLegal` | Yes | `navigation` (footer group) | Yes | P1 |
| Treks (listing + detail) | `treks.js` `treks[]` | **Yes** | `treks` (+ `trek_batches`, `itinerary`) | Yes | **P0** |
| Trek categories/groups/tags | `treks.js` `trekGroups/filterOptions/tags` | Yes | `categories`, `tags`, join tables | Yes | P0 |
| Tour packages | `tours.js` | **Yes** | `tours` | Yes | P0 |
| Filter & search options | `treks.js` `searchTreks/filterOptions` | Yes | derived from `treks`/`categories` (query) | Auto | P1 |
| Trek pricing & dates/batches | `treks.js` `price`, `duration` (static) | **Yes** | `trek_batches` (date, seats, price) | Yes | **P0** |
| Testimonials | `testimonials.js` | Yes | `testimonials` | Yes | P1 |
| Trust stats / reasons (Why Us) | `reasons.js`, `Stats.jsx` | Yes | `site_settings` / `page_sections` | Yes | P2 |
| Gallery landing + seasonal detail | `orig-gallery.html`, `gallery-details.js` | Yes | `media`, `galleries` | Yes | P1 |
| Trek stories | `stories.js` | Yes | `blog_posts` (or `stories`) | Yes | P2 |
| Blog / articles | **none** | Yes | `blog_posts`, `blog_categories` | Yes | P1 |
| Shop products | `orig-shop.html` (static) | Yes | `products` | Yes | P2 |
| Corporate / student programme pages | `orig-*.html` | Partial | `pages` (CMS block) | Yes | P2 |
| Legal/policy pages (terms, cancellation, etc.) | `orig-*.html` | Yes | `pages` (CMS block) | Yes | P1 |
| Guide pages (packing, fitness, beginner) | `orig-*.html` | Partial | `pages` | Yes | P2 |
| FAQs | embedded in legacy HTML | Yes | `faqs` | Yes | P2 |
| Partners/logos | `Partners.jsx` | Yes | `site_settings` / `media` | Yes | P3 |
| Team | not a dedicated section | Optional | `team` | Yes | P3 |
| CTAs (WhatsApp/enquire buttons) | hardcoded in components | Partial | `site_settings` | Yes | P2 |
| SEO metadata (title/desc/OG per page) | per-route `metadata` in code | **Yes** | `seo_meta` (per entity/route) | Yes | P1 |
| Contact / enquiry submissions | `alert()` — **discarded** | **Yes** | `leads` | Yes (view/manage) | **P0** |
| Bookings | **none** | **Yes** | `bookings` | Yes (manage) | P0 |
| Payments/orders | **none** | **Yes** | `payments`, `orders` | Yes (view) | P0 |
| Users / accounts | static mock | **Yes** | Supabase Auth + `profiles` | Yes (manage) | P1 |
| User dashboard content (bookings, wishlist) | static mock HTML | **Yes** | `bookings`, `wishlist` per user | User-generated | P1 |
| Travel calendar | `orig-travel-calendar.html` | Yes | derived from `trek_batches` | Auto | P1 |
| Payment method icons | `site.js` images | No | static (display only) | — | P3 |
| Legacy template CSS/JS runtime | external domain | No → self-host | n/a (asset pipeline) | — | **P0** (availability) |

## Summary of the shift

- **Must become database-driven + admin-managed (P0):** treks, tours, batches/
  pricing, categories, contact info, leads, bookings, payments.
- **Should become database-driven (P1):** navigation, footer, testimonials,
  gallery/media, blog, legal/policy pages via a CMS `pages` model, per-entity
  SEO, users/accounts.
- **Can stay static or auto-generated:** payment-method icons, derived filters,
  travel calendar (derived from batches), a few brochure sections.
- **Remains an asset/infrastructure task, not content:** self-host the legacy
  template bundle to remove the external-domain single point of failure (P0 for
  availability even though it is not "content").

The design target: **no business content lives in source code.** Editors change
treks, prices, dates, pages, testimonials, blog, nav and SEO from the admin;
developers change behavior, not copy. See the models in
[V2_PROPOSAL.md](V2_PROPOSAL.md#supabase-architecture).
