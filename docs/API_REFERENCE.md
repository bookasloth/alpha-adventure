# API Reference

## No application APIs.
This repo defines **no** `app/api/**` route handlers, server actions, or public
endpoints. The site does not `fetch()` its own backend; all content is imported
statically from `src/data/*.js` at build time.

## The only server-side "endpoints" are rewrites
Configured, not implemented in this repo:

| Incoming | Handled by | Destination |
|---|---|---|
| `/gallery-detail.php?slug=…` | `src/middleware.js` | internal rewrite → `/gallery/<slug>` or `/gallery` |
| `/assets/:path*` | `next.config.mjs` rewrites | `https://alpha.thegreyhawks.com/assets/:path*` |
| `/Admin/uploads/:path*` | `next.config.mjs` rewrites | `https://alpha.thegreyhawks.com/Admin/uploads/:path*` |

## Data access "API" (internal)
Components consume content through plain JS helpers instead of HTTP:
- `getTrekBySlug(slug)`, `treks`, `popularTreks`, `trekGroups`, `filterOptions`
  — `src/data/treks.js`
- `getTourBySlug(slug)`, `tourPackages` — `src/data/tours.js`
- `getGalleryPage(slug)`, `galleryPages`, `gallerySlugSet` — `src/data/gallery-details.js`
- `img(path)` — `src/lib/assets.js`

If you need to add a real API, treat it as an architectural decision
([DECISIONS.md](DECISIONS.md)) and keep these helper signatures so components
don't change. See also [INTEGRATIONS.md](INTEGRATIONS.md).
