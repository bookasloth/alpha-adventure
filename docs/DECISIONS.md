# Decisions

Architectural/technical decisions inferred from the repository. Where the
rationale isn't recorded, it says so — no invented history.

---

# Decision: Rebuild the live PHP site as a static Next.js App Router site
## Status
Accepted
## Context
An existing site runs at `alpha.thegreyhawks.com` (PHP). This repo re-implements
it on Next.js 14 while preserving the exact look.
## Decision
Use Next.js 14 App Router, React 18, Tailwind, JS (no TS). SSG throughout.
## Reason
Historical rationale is not documented. Evidence shows the goal was visual
parity with minimal asset re-authoring (assets reused from the live domain).
## Consequences
Modern routing/SSG + component reuse, but a hard runtime tie to the old domain
until assets are self-hosted.
## Evidence
`package.json`, `next.config.mjs`, `src/data/orig-*.html`, `src/lib/assets.js`.

---

# Decision: Reuse live-domain assets instead of bundling them
## Status
Accepted (with known risk)
## Context
The template ships large CSS/JS/image/video assets.
## Decision
Proxy `/assets/*` and `/Admin/uploads/*` to the live domain, hot-link images via
`img()`, and load the JS bundle at runtime from there.
## Reason
Historical rationale is not documented; the in-code comment in `assets.js`
("so the rebuild looks identical … swap to /assets/img if you download assets
locally") shows it was a deliberate, reversible shortcut.
## Consequences
Fast to build parity; external runtime dependency and no version pinning/SRI.
Reversal path is documented in the code and [INTEGRATIONS.md](INTEGRATIONS.md).
## Evidence
`next.config.mjs`, `src/lib/assets.js:1-5`, `TemplateScripts.jsx`.

---

# Decision: Two rendering patterns (React data-driven + verbatim HTML injection)
## Status
Accepted
## Context
Some pages have rich structure worth modelling (treks/tours); others are content-
heavy legacy pages where re-authoring in React adds risk without value.
## Decision
Model treks/tours/gallery as JS data rendered by React (Pattern A); serve other
pages by injecting their original HTML + re-running their jQuery init (Pattern B).
## Reason
Historical rationale is not documented. Pattern B preserves exact behaviour of
complex legacy pages cheaply.
## Consequences
Contributors must know which pattern a route uses; Pattern B couples HTML to its
init script and uses `dangerouslySetInnerHTML` (see [SECURITY.md](SECURITY.md)).
## Evidence
`src/app/**/page.jsx`, `src/components/*Scripts.jsx`, `src/data/orig-*.html`.

---

# Decision: No database, no backend, no API in this repo
## Status
Accepted
## Context
Content is finite and editor-controlled.
## Decision
Store all content in `src/data/*.js` and `orig-*.html`; expose it via plain
helper functions imported at build time.
## Reason
Historical rationale is not documented; consistent with a static marketing site.
## Consequences
Editing content = editing code + rebuild. No admin UI (client wanted one — see
[KNOWN_ISSUES.md](KNOWN_ISSUES.md) #6). Clean seam to add a CMS later behind the
same helper shapes.
## Evidence
Absence of `app/api/**`, DB deps, `process.env`; `src/data/*`, `src/lib/*`.

---

# Decision: JavaScript, not TypeScript
## Status
Accepted
## Context
`jsconfig.json` with `allowJs`, `strict:false`; all source is `.js`/`.jsx`.
## Decision
Stay in JS.
## Reason
Historical rationale is not documented.
## Consequences
Lower ceremony; no compile-time type safety on the data shapes (a lint/test net
would help — see [TESTING.md](TESTING.md)).
## Evidence
`jsconfig.json`, file extensions across `src/`.

---

# Decision: Preserve legacy `.php` URLs via middleware
## Status
Accepted
## Context
Old inbound/deep links point at `gallery-detail.php?slug=`.
## Decision
Middleware rewrites `/gallery-detail.php` to the new gallery routes.
## Reason
Historical rationale is not documented; clearly SEO/link-preservation.
## Consequences
Middleware `matcher` is intentionally narrow; broadening it (e.g. for future
auth) must not break this rewrite.
## Evidence
`src/middleware.js`.

---

# Decision: `seven-sisters-hill-trek` gets a bespoke static page
## Status
Accepted
## Context
It is a flagship near-Nagpur trip with full, hand-crafted content.
## Decision
Serve it from its own Pattern B route and exclude it from the dynamic
`trips-near-nagpur/detail/[slug]` route (`STATIC_SLUGS`).
## Reason
Historical rationale is not documented; avoids a route collision and preserves
the rich original layout.
## Consequences
Two code paths for near-Nagpur details; remember the exclusion when editing.
## Evidence
`src/app/trips-near-nagpur/detail/[slug]/page.jsx:8,24`, and the sibling static
route.
