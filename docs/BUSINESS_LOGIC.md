# Business Logic

Rules actually implemented in code. Format: `IF … THEN … [UNLESS …]`. Where a
rule is data-driven, the data file is the source of truth. No pricing/discount/
tax/booking engine exists — see the "Absent" section.

## Listing membership
- IF a trek object has `group === "sahyadri" | "himalayan" | "central"` THEN it
  appears on `/treks/upcoming-treks` and on `/treks/upcoming-treks/<group>-treks`.
  Evidence: `src/app/treks/upcoming-treks/page.jsx`, `.../[group]/page.jsx`.
- IF `group === "backpacking"` THEN it belongs to the Backpacking section.
- IF `group === "near-nagpur"` THEN it is a "Trips Near Nagpur" item and its
  detail is served at `/trips-near-nagpur/detail/<slug>` (via `TripDetail`).
- The `[group]` route maps ONLY these slugs: `sahyadri-treks→sahyadri`,
  `himalayan-treks→himalayan`, `central-india-treks→central`.
  UNLESS the group slug is `weekend-treks`, THEN it renders treks whose `tags`
  include any of `beginner | weekend | half-day`. Any other group slug →
  `notFound()`.

## Detail-page resolution
- `/treks/[slug]`: IF `getTrekBySlug(slug)` found THEN render `TrekDetail`
  ELSE `notFound()`. Only slugs in `treks[]` are statically generated.
- `/trips-near-nagpur/detail/[slug]`: IF trek found AND `group==="near-nagpur"`
  AND slug NOT in `STATIC_SLUGS (["seven-sisters-hill-trek"])` THEN render
  `TripDetail` ELSE `notFound()`. `seven-sisters-hill-trek` has its **own static
  route** (`.../detail/seven-sisters-hill-trek/page.jsx`, Pattern B) and is
  excluded from the dynamic route to avoid a collision.
- `/tour-packages/[slug]`: IF `getTourBySlug(slug)` found THEN render ELSE
  `notFound()`.
- `/gallery/[slug]`: `dynamicParams = false` — IF slug NOT in `gallerySlugSet`
  THEN `notFound()`. Only pre-listed gallery slugs exist.

## Legacy URL preservation
- IF an inbound request path is `/gallery-detail.php` AND `?slug=` is one of the
  9 `KNOWN_SLUGS` THEN rewrite to `/gallery/<slug>` ELSE rewrite to `/gallery`.
  Evidence: `src/middleware.js`.

## Booking / enquiry (no transactions)
- "Book / Enquire" and CTAs link to `site.whatsapp` (WhatsApp) or `/contact`.
  There is **no** order, payment, or availability logic.
  Evidence: `src/app/tour-packages/[slug]/page.jsx:58`.
- The homepage search form calls `onSubmit={e => e.preventDefault()}` — it
  filters a static list client-side and does not submit anywhere.
  Evidence: `src/components/home/SearchWidgets.jsx`.

## Pricing
- `price` is a static INR integer per trek/tour, displayed with
  `toLocaleString("en-IN")`. No discounts, GST, per-person math, or currency
  conversion. To change a price, edit the data file.

## Gallery reveal
- Per season, IF an image index `>= VISIBLE_INITIAL` THEN it starts hidden
  (`gd-hidden`); "View All Photos" reveals the rest (behaviour driven by
  `gallery-detail-init.js`). Evidence: `src/lib/galleryDetailHtml.js`.

## Absent by design (do not assume these exist)
No user accounts, roles, sessions, cart, checkout, payment gateway,
availability/seat logic, cancellation processing, notifications/email/SMS,
cron/background jobs, or admin CRUD. `/user-dashboard` is a static mock.
The client's "admin backend per feature" requirement is **not implemented in
this repo** — see [KNOWN_ISSUES.md](KNOWN_ISSUES.md) and
[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md).
