# Project Overview

## What this is
The public marketing website for **Alpha Adventures**, a trekking & travel
agency based in Nagpur, Maharashtra. It showcases treks, backpacking trips,
tour packages, guides and policies, and pushes visitors to enquire/book via
WhatsApp, phone and a contact form.

It is a **Next.js 14 (App Router) rebuild** of an existing live PHP site,
`https://alpha.thegreyhawks.com`. The rebuild reuses the live site's CSS, JS
and images by proxying/hot-linking them (see
[ARCHITECTURE.md](ARCHITECTURE.md)). Evidence: `next.config.mjs` rewrites,
`src/lib/assets.js`, `src/data/orig-*.html`.

## What it is NOT
- Not an application with accounts, sessions, or a database.
- Not a booking engine — no cart, no payment, no order records.
- `/user-dashboard` is a **static visual mock** (verbatim legacy HTML), not a
  real logged-in area. Evidence: `src/app/user-dashboard/page.jsx`.

## Who uses it
- **Prospective trekkers / travellers** — browse treks & packages, read guides,
  enquire.
- **Content editors / developers** — update trek/tour/gallery data in
  `src/data/*.js` or legacy page bodies in `src/data/orig-*.html`.

There are no in-app "user types" in a permissions sense — everyone is an
anonymous visitor. See [AUTHORIZATION.md](AUTHORIZATION.md).

## Major features
Homepage, trek listings (by group & filters), trek/trip detail pages, tour
packages + detail, gallery + per-destination seasonal gallery, and a set of
informational/legal pages (guides, policies, corporate/student programmes).
Full list & flows: [FEATURES.md](FEATURES.md), [ROUTES.md](ROUTES.md).

## Business context
Client scope was a 17-item build (~₹75k) where each feature was expected to have
UX + an admin backend. **This repo delivers the front-end/UX layer only**; no
admin backend is present here. See [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md) and
[KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Key facts
- Currency: INR (₹), static integers in data files.
- Contact: `info@alphaadventures.in`, `+91 8180001597`, WhatsApp
  `wa.me/918180001597` (from `src/data/site.js`).
- Live asset/source domain: `alpha.thegreyhawks.com`.
