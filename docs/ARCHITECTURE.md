# Architecture

## High level
Static/SSG Next.js 14 App Router site. No server runtime logic of its own beyond
Next's rendering, one middleware rewrite, and `next.config.mjs` rewrites that
**proxy asset paths to the live domain**. Content is compiled from local JS/HTML
files at build time.

```
Browser
  │
  ├── HTML/React (this repo, built by Next.js)
  │
  ├── /assets/*  ──rewrite──►  https://alpha.thegreyhawks.com/assets/*   (css, js, video)
  ├── /Admin/uploads/* ─rewrite─► live domain                            (uploaded imgs)
  └── https://alpha.thegreyhawks.com/assets/img/*  (hot-linked directly via img())
```
Evidence: `next.config.mjs`, `src/lib/assets.js:3`, `src/components/home/Hero.jsx:12`.

## Two rendering patterns
This is the single most important thing to understand. **Identify which pattern
a route uses before editing.**

### Pattern A — React / data-driven
Route reads structured data from `src/data/*.js` and renders it through React
components.
- Routes: `/` (`src/app/page.jsx`), `/treks/[slug]`, `/treks/upcoming-treks`,
  `/treks/upcoming-treks/[group]`, `/treks/backpacking-trips`,
  `/treks/trips-near-nagpur`, `/tour-packages`, `/tour-packages/[slug]`,
  `/trips-near-nagpur/detail/[slug]`, `/not-found`, `[...slug]` (placeholder).
- Components: `src/components/home/**`, `src/components/treks/**`,
  `src/components/ui/**`, `src/components/layout/**`.
- To change content: edit the data array. Detail + listing pages update
  automatically (`getTrekBySlug`, `treks.filter(...)`).

### Pattern B — verbatim legacy HTML injection
Route reproduces a live PHP page byte-for-byte.
- Server reads `src/data/orig-<page>.html` via `fs.readFileSync` and injects it
  with `dangerouslySetInnerHTML`.
- A client component `<XScripts initCode={...} />` (`src/components/*Scripts.jsx`)
  appends the page's original jQuery init (a string read from
  `src/data/<page>-init.js`) as a `<script>` after mount.
- Routes: `about-us`, `contact`, `user-dashboard`, `gallery`, `gallery/[slug]`,
  `shop`, `corporate-programmes`, `student-programmes`, `travel-calendar`,
  `beginner-trek-guide`, `fitness-requirements`, `packing-checklist`,
  `responsible-travel`, `safety-guidelines`, `cancellation-policy`,
  `terms-and-conditions`, `backpacking-trips/detail/spiti-backpacking-trip`,
  `trips-near-nagpur/detail/seven-sisters-hill-trek`.
- Special case: `gallery/[slug]` builds its HTML programmatically with
  `src/lib/galleryDetailHtml.js` from season data in `src/data/gallery-details.js`
  (not a static `orig-*.html`), then injects it the same way.

**Coupling warning:** the injected HTML and its `*-init.js` are bound by CSS
classes/IDs. Editing markup without matching the init (or vice versa) breaks
behaviour. See [SECURITY.md](SECURITY.md).

## Global shell
`src/app/layout.jsx` provides `<html>` + `<head>` (base href, legacy CSS
`<link>`s), the magic-cursor divs, `<SiteHeader>` / `<SiteFooter>` (both Pattern
B, from `orig-topbar/header/footer.html`), `<main>{children}</main>`, and
`<TemplateScripts />`.

`TemplateScripts.jsx` sequentially loads the legacy JS bundle (jQuery, jQuery-UI,
Bootstrap, Swiper, Slick, GSAP+ScrollTrigger, Fancybox, custom.js, search-bar.js)
from `/assets/js/*` **in dependency order**, guarded by
`window.__templateScriptsStarted`. Order matters — jQuery must load first.

## Frontend architecture
Server components by default. `"use client"` only where needed:
`SearchWidgets.jsx` (stateful filter UI) and every `*Scripts.jsx`.

## Backend architecture
None in this repo. No `app/api/**`, no DB client, no server actions, no env
reads. Dynamic-looking pages are static SSG with `generateStaticParams`.

## Middleware
`src/middleware.js` matches only `/gallery-detail.php` and rewrites it to
`/gallery/<slug>` (if slug is in `KNOWN_SLUGS`) or `/gallery`. Preserves inbound
links from the old PHP site.

See also: [ROUTES.md](ROUTES.md), [DATA_MODEL.md](DATA_MODEL.md),
[INTEGRATIONS.md](INTEGRATIONS.md), [DECISIONS.md](DECISIONS.md).
