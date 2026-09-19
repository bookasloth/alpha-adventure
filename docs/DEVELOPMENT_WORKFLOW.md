# Development Workflow

## Setup
```bash
npm install            # or: npm ci
npm run dev            # http://localhost:3000 (.claude/launch.json uses autoPort)
```
No env file needed ([ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md)).
Requires internet access — assets/images load from the live domain even in dev.

## Commands (all from `package.json`)
| Command | Does |
|---|---|
| `npm run dev` | Next dev server + HMR |
| `npm run build` | Production build (also your main correctness check) |
| `npm run start` | Serve the production build |
| `npm run lint` | `next lint` (see [TESTING.md](TESTING.md) caveat) |

No test, format, or migration commands exist. Do not invent them.

## Common tasks
### Add or edit a trek / trip
Edit the object in `src/data/treks.js`. Listing pages and `/treks/[slug]` (and
`/trips-near-nagpur/detail/[slug]` for `group: "near-nagpur"`) pick it up via
`generateStaticParams`. Set `group` and `tags` correctly — they drive placement
and filters ([BUSINESS_LOGIC.md](BUSINESS_LOGIC.md)).

### Add or edit a tour package
Edit `src/data/tours.js`.

### Add a gallery
Add a page object to `src/data/gallery-details.js`
(`{slug,title,hero,heroAlt,seasons[]}`). It builds via `galleryDetailHtml.js`.

### Edit a legacy (Pattern B) page
Edit the matching `src/data/orig-<page>.html`. If behaviour changes, also update
that page's `<page>-init.js`. Keep CSS classes/IDs in sync — they couple the
markup to the init script ([ARCHITECTURE.md](ARCHITECTURE.md)).

### Add a new React route
Create `src/app/<kebab>/page.jsx`. Add `export const metadata` (or
`generateMetadata`). Reuse `PageHero`, `TrekGrid`, `ui/*` and Tailwind tokens
([UI_SYSTEM.md](UI_SYSTEM.md)).

### Change branding / nav / contact
Edit `src/data/site.js`.

## Conventions
- JS/JSX only, no TypeScript. Use `@/` for imports from `src/`.
- Server components by default; `"use client"` only for interactivity.
- Never hardcode the CDN host — use `img()` from `src/lib/assets.js`.
- PascalCase components, kebab-case routes/data files.

## PR expectations
No formal template exists. Before opening a PR: `npm run build` passes, no new
hardcoded asset hosts, content changes verified in `npm run dev`. Commit style:
follow existing history (currently a single "Initial commit").

## Housekeeping
Several `*.log` files sit in the working directory (dev-server output). They are
already covered by `.gitignore` (`*.log`) and are untracked — safe to delete.
`harishchandragad-gallery.html` at the repo root is a tracked loose reference
file, not a route. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
