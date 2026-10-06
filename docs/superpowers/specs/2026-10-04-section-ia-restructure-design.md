# Section IA Restructure — Treks vs Trips

Date: 2026-10-04
Status: Draft for review

## Problem

Guided **treks** and leisure **trips** (backpacking, near-Nagpur, tours) are
conceptually different products, but the site conflates them in both URLs and
navigation:

- All listing pages nest under `/treks/`: `/treks/upcoming-treks`,
  `/treks/backpacking-trips`, `/treks/trips-near-nagpur`.
- `/treks/[slug]` is a catch-all resolving either a trek **detail** or a
  state/difficulty **collection**, producing Frankenstein URLs like
  `/treks/backpacking-trips/madhya-pradesh`.
- Legacy nav (`orig-header.html`) already links to **top-level** roots
  (`/backpacking-trips`, `/upcoming-treks`, …) that don't match the real Next
  routes, and carries junk slug suffixes (`gujarat-1781965392`).
- Every trek, backpacking trip and near-Nagpur trip is a row in the **one
  `treks` table**, split only by a `group` column; all share the single
  `/treks/[slug]` detail template (altitude/difficulty/basecamp), which is
  wrong for leisure trips.

## Goal

A clean information architecture where guided treks and leisure trips are
distinct products, with honest URLs and type-appropriate detail pages, so the
site reads as coherent (including for the PhonePe review).

## Decisions (agreed)

1. **Four flat top-level sections**, each with its own listing + detail route +
   detail template:
   - `/treks` (guided treks)
   - `/backpacking-trips`
   - `/trips-near-nagpur`
   - `/tour-packages` (already exists)
2. **Keep one `treks` table.** Booking, pricing, departures, admin and RLS all
   key off `trek_id`; splitting tables is out of scope. The existing `group`
   column maps rows to sections. No schema migration.
3. **Separate detail templates** per product line (treks vs leisure trips).
4. **Routing style A — resolve-or-fallback.** Within a section,
   `/<section>/<segment>` tries item-slug first, else a state/region
   collection, else 404. Cleanest URLs; matches what the code already does.

## Route map (target)

| Section | Listing | Sub-listing | Detail |
|---|---|---|---|
| Treks | `/treks` | `/treks/sahyadri-treks`, `/treks/himalayan-treks`, `/treks/central-india-treks`, `/treks/weekend-treks` | `/treks/<slug>` |
| Backpacking | `/backpacking-trips` | `/backpacking-trips/<state>` | `/backpacking-trips/<slug>` |
| Near Nagpur | `/trips-near-nagpur` | — | `/trips-near-nagpur/<slug>` |
| Tour Packages | `/tour-packages` | — | `/tour-packages/<slug>` |

Resolution order for `/<section>/<segment>` (treks + backpacking):

1. Item slug whose `group` maps to **this** section → render detail.
2. Item slug whose `group` maps to a **different** section → **301** to its
   canonical `/<other-section>/<slug>`.
3. Segment matches a group alias (treks only: `sahyadri-treks` etc.) or a
   state/region → render collection listing.
4. Else `notFound()`.

`/trips-near-nagpur/<segment>` skips the collection step (no sub-listings).

## Components / files

### New: `src/lib/sections.ts`

The spine. Pure, unit-testable, no I/O.

- `GROUP_TO_SECTION: Record<string, Section>` —
  `sahyadri|himalayan|central → "treks"`,
  `backpacking → "backpacking-trips"`, `near-nagpur → "trips-near-nagpur"`.
- `type Section = "treks" | "backpacking-trips" | "trips-near-nagpur"`.
- `sectionOf(group: string | null): Section | null`.
- `canonicalPath(row: { group: string | null; slug: string }): string` →
  `/<section>/<slug>` (falls back to `/treks/<slug>` if group unknown).
- `GROUP_ALIASES` for the treks group-listing slugs
  (`sahyadri-treks → sahyadri`, …) — moved out of the current
  `upcoming-treks/[group]` route so both the treks root and its `[segment]`
  route share one source.

### Routes

- **New** `src/app/treks/page.jsx` — treks listing (the current
  `upcoming-treks/page.jsx` body: sahyadri/himalayan/central sections, links to
  group sub-listings). 
- **Rework** `src/app/treks/[slug]/page.jsx` — resolver per the order above:
  group-alias listing → trek detail (group in treks) → wrong-section 301 →
  state/difficulty collection → 404.
- **New** `src/app/backpacking-trips/page.jsx` — listing (current
  `treks/backpacking-trips/page.jsx` body).
- **New** `src/app/backpacking-trips/[slug]/page.jsx` — resolver: backpacking
  detail (TripDetail) → wrong-section 301 → state collection → 404.
- **New** `src/app/trips-near-nagpur/page.jsx` — listing (current body).
- **New** `src/app/trips-near-nagpur/[slug]/page.jsx` — resolver: near-nagpur
  detail (TripDetail) → wrong-section 301 → 404.
- **Delete** (replaced by redirects): `src/app/treks/upcoming-treks/**`,
  `src/app/treks/backpacking-trips/**`, `src/app/treks/trips-near-nagpur/**`.

The root `[...slug]` catch-all is unaffected — explicit routes take precedence.

### Templates

- **`TrekDetail.jsx`** (Supabase) — stays on `/treks/<slug>`. Fix the
  hardcoded breadcrumb that always links "Backpacking Trips" → derive the
  section label/href from the row's group via `sections.ts`.
- **`TripDetail.jsx`** (currently orphaned, static-data-shaped) — rewire to the
  Supabase detail object returned by `getTrekBySlug` (map `image → hero_image`,
  and read `overview/gallery/itinerary/inclusions/exclusions/badge`). Used by
  backpacking + near-Nagpur details. Breadcrumb derived from section.
- Tour detail — unchanged this pass.

### Data access (`src/lib/trekListing.ts`, `src/lib/trekCollection.ts`, `src/lib/trekDetail.ts`)

- Reuse `getListingTreks()` + filter by `group` per section (as the pages do
  now).
- `getTrekBySlug()` unchanged (already returns full detail incl. `group`).
- `getCollection()` — make section-aware: accept the section so a state
  listing under `/backpacking-trips` only matches backpacking rows, and under
  `/treks` only trek-group rows. Keep difficulty collections for treks.

### Redirects (`next.config.mjs`)

301, permanent:

- `/treks/upcoming-treks` → `/treks`
- `/treks/upcoming-treks/:group` → `/treks/:group`
- `/treks/backpacking-trips` → `/backpacking-trips`
- `/treks/backpacking-trips/:rest*` → `/backpacking-trips/:rest*`
- `/treks/trips-near-nagpur` → `/trips-near-nagpur`
- `/treks/trips-near-nagpur/:rest*` → `/trips-near-nagpur/:rest*`
- Flip existing legacy rules to new canonicals:
  - `/backpacking-trips/detail/:slug` → `/backpacking-trips/:slug`
  - `/trips-near-nagpur/detail/:slug` → `/trips-near-nagpur/:slug`
  - keep `spiti-backpacking-trip` special-case → `/backpacking-trips/spiti-valley`

Old `/treks/<leisure-slug>` links are handled at runtime by the wrong-section
301 guard, so no static rule needed for those.

### Navigation (`orig-header.html`, `orig-footer.html`)

Rewrite nav to the four clean roots; drop junk `-1781965392` suffixes
(`/backpacking-trips/gujarat-1781965392` → `/backpacking-trips/gujarat`).
Pattern B static HTML — plain string edits, coupled only by CSS classes which
stay untouched.

### Sitemap (`src/app/sitemap.ts`)

Emit per-section listing + detail URLs using `canonicalPath()`.

## Non-goals / follow-ups

- No table split, no new columns.
- Admin trek form `group` selection: verify it lets staff set the group that
  drives the section. Flagged as a follow-up check, not a blocker.
- Tour-packages detail redesign — separate pass.

## Testing

- **Unit** (`sections.ts`): `sectionOf`, `canonicalPath`, `GROUP_ALIASES`;
  section-scoped `getCollection` mapping.
- **Manual / e2e:** each of the four listings renders; one detail per section
  renders with the correct template + breadcrumb; a known old URL
  (`/treks/backpacking-trips/madhya-pradesh`, `/treks/spiti-valley`) 301s to the
  new canonical.

## Phasing (for the plan)

1. `sections.ts` + new routes + resolver + template rewiring + wrong-section
   guard.
2. Redirects + nav/footer rewrite + sitemap.

Both ship together for a coherent result; the split is for plan ordering only.
