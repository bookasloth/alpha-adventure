# CLAUDE.md — Alpha Adventures

Operating manual for AI agents and developers. Keep it accurate; when a topic
gets deep, follow the link into `docs/`.

## 1. Project identity
Marketing website for **Alpha Adventures**, a trekking & travel agency
(Nagpur, Maharashtra). It is a **static, content-first Next.js rebuild** of an
existing live PHP site at `https://alpha.thegreyhawks.com`. There is **no
backend in this repo** — no database, no auth, no API routes, no payments.
Bookings/enquiries go out via WhatsApp/phone links and the migrated contact form.

## 2. Tech stack
Next.js 14 (App Router) · React 18 · Tailwind CSS 3 · plain JavaScript (JSX, no
TypeScript). Legacy jQuery/Bootstrap/GSAP template runtime loaded at runtime
from the live domain. Full list: [docs/TECH_STACK.md](docs/TECH_STACK.md).

## 3. Architecture summary
Two rendering patterns coexist — know which you are editing:
- **Pattern A — React/data-driven:** homepage, trek/tour listings & detail
  pages. Rendered from JS data in `src/data/*.js` through React components.
- **Pattern B — verbatim HTML injection:** legacy pages served by reading
  `src/data/orig-*.html` with `fs.readFileSync` and injecting via
  `dangerouslySetInnerHTML`, then re-running the page's jQuery init from a
  `*-init.js` string via a `*Scripts.jsx` client component.

Assets (CSS/JS/images/video) are **not in this repo**; they are proxied/hot-
linked from the live domain. Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 4. Important directories
- `src/app/**` — App Router routes (`page.jsx` per route).
- `src/components/home/**` — homepage sections (Pattern A).
- `src/components/treks/**`, `src/components/ui/**` — listing/detail UI.
- `src/components/layout/**` — header, footer, page hero.
- `src/components/*Scripts.jsx` — client components that run legacy init code.
- `src/data/*.js` — **content source of truth** (treks, tours, gallery, site config).
- `src/data/orig-*.html` + `src/data/*-init.js` — verbatim legacy page bodies + their init.
- `src/lib/` — `assets.js` (image base URL), `galleryDetailHtml.js` (HTML builder).
- `src/middleware.js` — legacy `.php` URL rewrite.
Full map: [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md).

## 5. Important commands
```bash
npm run dev     # local dev (localhost:3000; .claude/launch.json auto-ports)
npm run build   # production build
npm run start   # serve production build
npm run lint    # next lint
```
No test command exists. See [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md).

## 6. Development workflow
Edit content in `src/data/*.js` (Pattern A) or the matching `orig-*.html`
(Pattern B). Adding a trek/tour = add an object to the data array; detail and
listing pages pick it up automatically. See
[docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) and
[docs/FEATURES.md](docs/FEATURES.md).

## 7–11. Conventions (coding / naming / component / API / DB)
- JS + JSX only, no TypeScript. `@/` alias → `src/` (see `jsconfig.json`).
- Components: PascalCase files. Data files: kebab-case. Routes: kebab-case dirs.
- Server components by default; add `"use client"` only for interactivity
  (`SearchWidgets`, all `*Scripts.jsx`).
- **API:** none in-repo — do not invent `app/api/**` without discussion. Data is
  imported from `src/data/*.js`, not fetched.
- **DB:** none. Content lives in JS/HTML files. See [docs/DATABASE.md](docs/DATABASE.md).
- Image URLs come from `img()` in `src/lib/assets.js` — never hardcode the CDN host.

## 12–14. Auth / authorization / validation
None implemented. `/user-dashboard` is a **static mock** (injected HTML), not a
real authenticated area. Do not assume a session. The search form uses
`onSubmit={e => e.preventDefault()}` — no server submit. See
[docs/AUTHENTICATION.md](docs/AUTHENTICATION.md).

## 15. Error handling
`not-found.jsx` for 404s; dynamic routes call `notFound()` for unknown slugs;
script loader swallows load errors (`s.onerror = load`). See
[docs/ERROR_HANDLING.md](docs/ERROR_HANDLING.md).

## 16. Testing
No test framework configured. [docs/TESTING.md](docs/TESTING.md).

## 17. Security — READ BEFORE EDITING PATTERN B
`dangerouslySetInnerHTML` renders `orig-*.html` and `galleryDetailHtml()`
output. This is safe **only because the HTML is static and author-controlled**.
Never feed user input, query params, or fetched content into these paths. See
[docs/SECURITY.md](docs/SECURITY.md).

## 18. Performance
Legacy CSS/JS bundle is large and runtime-loaded from the live domain; the site
depends on that domain being up. Images hot-linked from the CDN. See
[docs/PERFORMANCE.md](docs/PERFORMANCE.md).

## 19. UI / design rules
Tailwind tokens in `tailwind.config.js` (`primary #fe5100`, `accent #FFB52A`,
`dark/ink #110F0F`). Reusable classes (`btn-primary`, `card`, `section-title`,
`container-px`) come from the legacy `style.css`. Reuse them; check
[docs/UI_SYSTEM.md](docs/UI_SYSTEM.md) before inventing new ones.

## 20. SEO
Per-route `metadata` / `generateMetadata`. Root template title
`%s | Alpha Adventures`. No sitemap/robots yet. See FEATURES.md.

## 21. Deployment
Configured for Vercel-style hosting (`.gitignore` has `.vercel`). **Hard
dependency on the live asset domain** at build/runtime. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 22. Environment variables
**None** are read anywhere in the code. See
[docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md).

## 23. Important business rules
Prices are static INR integers in data files; no discount/tax logic. Booking =
WhatsApp/contact redirect, not a transaction. Trek `group`/`tags`/`state` drive
all filtering and listing membership. Full rules:
[docs/BUSINESS_LOGIC.md](docs/BUSINESS_LOGIC.md).

## 24. Dangerous areas — do not change casually
- `next.config.mjs` rewrites & `src/lib/assets.js` — break every asset if wrong.
- `orig-*.html` + matching `*-init.js` — markup and the init script are coupled
  by CSS classes/IDs; editing one breaks the other.
- `src/components/TemplateScripts.jsx` load order — scripts have dependencies
  (jQuery first). Reordering breaks the template.
- `src/middleware.js` matcher — legacy `.php` inbound links depend on it.

## 25. Known technical debt
[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md). Highlights: dependency on external
asset domain; duplicate `IMG_BASE` in `BackpackingTripsClient.jsx`; some nav
links point to routes that only resolve to the generic `[...slug]` placeholder;
stray (gitignored) `*.log` dev files.

## 26. Docs index
[docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) — the full map.
