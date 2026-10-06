# Section IA Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split guided treks from leisure trips into four flat top-level sections (`/treks`, `/backpacking-trips`, `/trips-near-nagpur`, `/tour-packages`) with per-section listings, detail routes and detail templates, honest URLs, and 301s for every old nested URL.

**Architecture:** One `treks` table stays; a pure `group → section` map (`src/lib/sections.ts`) is the spine. Each section's `[slug]` route resolves item-slug → (wrong-section 301) → state collection → 404 (routing style A). Guided treks render `TrekDetail`; backpacking + near-Nagpur render the rewired `TripDetail`; tours unchanged.

**Tech Stack:** Next.js 14 App Router, React 18, Supabase (`@supabase/ssr`), Vitest, Tailwind. `@/` → `src/`.

**Spec:** `docs/superpowers/specs/2026-10-04-section-ia-restructure-design.md`

## Global Constraints

- New code in TypeScript where practical; `.js/.jsx` legacy stays. Components PascalCase, data files kebab-case, route dirs kebab-case.
- Server Components by default; add `"use client"` only for interactivity (none needed here).
- Amounts stored as **paise** (`base_price`), divide by 100 and round for rupees in UI.
- Image URLs via `img()` / stored `/assets/...` — never hardcode a host.
- Read user-facing data with the RLS-scoped SSR/public client (`publicClient()` in `src/lib/seo`); never the service-role client in these paths.
- No DB migration. Use existing `group` values: `sahyadri`, `himalayan`, `central`, `backpacking`, `near-nagpur`.
- Pattern B edits (`orig-*.html`) are plain string edits; do not touch CSS classes/IDs.

## Review Focus

- **Wrong-section slug:** `/treks/spiti-valley` (a `backpacking` row) must **301** to `/backpacking-trips/spiti-valley`, not 404 — pinned in Task 5 & 7 resolver tests via `canonicalPath`.
- **Unknown segment:** a segment that is neither a slug, a state, nor a group alias must `notFound()` (404), not render an empty listing — pinned in Task 5/6/7.
- **Empty state collection:** a state with zero published trips in that section must 404, not render a titled empty grid — pinned in Task 3 (`getCollection` returns null when list empty).
- **Legacy deep URL:** `/treks/backpacking-trips/madhya-pradesh` must 301 to `/backpacking-trips/madhya-pradesh` via a wildcard redirect — pinned in Task 8.
- **Null/unknown group:** a trek row with `group` null falls back to section `treks` (`canonicalPath` → `/treks/<slug>`) and still renders — pinned in Task 2 unit test.

---

## File Structure

- `src/lib/sections.ts` (new) — pure group↔section mapping, aliases, `canonicalPath`.
- `src/lib/sections.test.ts` (new) — unit tests for the above.
- `src/lib/trekCollection.ts` (modify) — make `getCollection` section-scoped.
- `src/lib/trekCollection.test.ts` (new) — unit test the section scoping with a stub.
- `src/lib/tripDetailProps.ts` (new) — adapter: Supabase trek-detail → `TripDetail` props.
- `src/components/treks/TripDetail.jsx` (modify) — accept a `breadcrumb` prop; consume adapter shape.
- `src/components/treks/TrekDetail.jsx` (modify) — section-aware breadcrumb.
- `src/app/treks/page.jsx` (new) — treks listing (moved from upcoming-treks).
- `src/app/treks/[slug]/page.jsx` (modify) — treks resolver.
- `src/app/backpacking-trips/page.jsx` (new) — listing.
- `src/app/backpacking-trips/[slug]/page.jsx` (new) — resolver.
- `src/app/trips-near-nagpur/page.jsx` (new) — listing.
- `src/app/trips-near-nagpur/[slug]/page.jsx` (new) — resolver.
- Delete: `src/app/treks/upcoming-treks/**`, `src/app/treks/backpacking-trips/**`, `src/app/treks/trips-near-nagpur/**`.
- `next.config.mjs` (modify) — redirects.
- `src/data/orig-header.html`, `src/data/orig-footer.html` (modify) — nav.
- `src/app/sitemap.ts` (modify) — per-section URLs.

---

## Task 1: `sections.ts` — group↔section spine

**Files:**
- Create: `src/lib/sections.ts`
- Test: `src/lib/sections.test.ts`

**Interfaces:**
- Produces:
  - `type Section = "treks" | "backpacking-trips" | "trips-near-nagpur"`
  - `sectionOf(group: string | null | undefined): Section` (defaults to `"treks"`)
  - `canonicalPath(row: { group?: string | null; slug: string }): string`
  - `GROUP_ALIASES: Record<string, string>` mapping listing-slug → group key (`"sahyadri-treks" → "sahyadri"`, `"himalayan-treks" → "himalayan"`, `"central-india-treks" → "central"`)
  - `SECTION_LABEL: Record<Section, string>` and `sectionHref(section): string`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/sections.test.ts
import { describe, it, expect } from "vitest";
import { sectionOf, canonicalPath, GROUP_ALIASES, sectionHref, SECTION_LABEL } from "./sections";

describe("sections", () => {
  it("maps trek groups to the treks section", () => {
    expect(sectionOf("sahyadri")).toBe("treks");
    expect(sectionOf("himalayan")).toBe("treks");
    expect(sectionOf("central")).toBe("treks");
  });
  it("maps leisure groups to their sections", () => {
    expect(sectionOf("backpacking")).toBe("backpacking-trips");
    expect(sectionOf("near-nagpur")).toBe("trips-near-nagpur");
  });
  it("falls back to treks for null/unknown group", () => {
    expect(sectionOf(null)).toBe("treks");
    expect(sectionOf("mystery")).toBe("treks");
  });
  it("builds canonical per-section detail paths", () => {
    expect(canonicalPath({ group: "backpacking", slug: "spiti-valley" })).toBe("/backpacking-trips/spiti-valley");
    expect(canonicalPath({ group: "sahyadri", slug: "rajgad-fort-trek" })).toBe("/treks/rajgad-fort-trek");
    expect(canonicalPath({ group: null, slug: "x" })).toBe("/treks/x");
  });
  it("exposes group aliases and section labels", () => {
    expect(GROUP_ALIASES["sahyadri-treks"]).toBe("sahyadri");
    expect(SECTION_LABEL["backpacking-trips"]).toBe("Backpacking Trips");
    expect(sectionHref("trips-near-nagpur")).toBe("/trips-near-nagpur");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/sections.test.ts`
Expected: FAIL — cannot find module `./sections`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/sections.ts
export type Section = "treks" | "backpacking-trips" | "trips-near-nagpur";

const GROUP_TO_SECTION: Record<string, Section> = {
  sahyadri: "treks",
  himalayan: "treks",
  central: "treks",
  backpacking: "backpacking-trips",
  "near-nagpur": "trips-near-nagpur",
};

export function sectionOf(group: string | null | undefined): Section {
  return (group && GROUP_TO_SECTION[group]) || "treks";
}

export function canonicalPath(row: { group?: string | null; slug: string }): string {
  return `/${sectionOf(row.group)}/${row.slug}`;
}

export const SECTION_LABEL: Record<Section, string> = {
  treks: "Treks",
  "backpacking-trips": "Backpacking Trips",
  "trips-near-nagpur": "Trips Near Nagpur",
};

export function sectionHref(section: Section): string {
  return `/${section}`;
}

// Treks group-listing slugs → group key used by /treks/[slug].
export const GROUP_ALIASES: Record<string, string> = {
  "sahyadri-treks": "sahyadri",
  "himalayan-treks": "himalayan",
  "central-india-treks": "central",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/sections.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/sections.ts src/lib/sections.test.ts
git commit -m "feat: group->section mapping spine for IA restructure"
```

---

## Task 2: Section-scoped `getCollection`

**Files:**
- Modify: `src/lib/trekCollection.ts`
- Test: `src/lib/trekCollection.test.ts` (new)

**Interfaces:**
- Consumes: `Section` from `./sections`.
- Produces: `getCollection(slug: string, section: Section)` — resolves a state (any section) or difficulty (treks only) collection **restricted to rows whose group maps to `section`**; returns `{ label, subtitle, kind, treks: Card[] } | null`. Returns `null` when no matching rows (so the route 404s). Keep the existing `toCard` shape.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/trekCollection.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const rows = [
  { slug: "spiti-valley", title: "Spiti", location: "HP", hero_image: null, base_price: 100000, duration_days: 8, difficulty: "difficult", state: "Himachal Pradesh", region: null, group: "backpacking" },
  { slug: "rajgad-fort-trek", title: "Rajgad", location: "Pune", hero_image: null, base_price: 89900, duration_days: 1, difficulty: "moderate", state: "Maharashtra", region: null, group: "sahyadri" },
];

vi.mock("./seo", () => ({
  isPublicSupabaseConfigured: true,
  toSlug: (s: string) => s.toLowerCase().replace(/\s+/g, "-"),
  publicClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ is: () => Promise.resolve({ data: rows }) }) }),
    }),
  }),
}));

import { getCollection } from "./trekCollection";

describe("getCollection (section-scoped)", () => {
  it("returns only backpacking rows for a state under backpacking-trips", async () => {
    const col = await getCollection("himachal-pradesh", "backpacking-trips");
    expect(col?.treks.map((t) => t.slug)).toEqual(["spiti-valley"]);
  });
  it("does not leak treks into a backpacking state collection", async () => {
    const col = await getCollection("maharashtra", "backpacking-trips");
    expect(col).toBeNull(); // only sahyadri (treks) row is in Maharashtra
  });
  it("returns null for an unknown segment", async () => {
    expect(await getCollection("atlantis", "treks")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/trekCollection.test.ts`
Expected: FAIL — `getCollection` takes one arg / ignores section.

- [ ] **Step 3: Write minimal implementation**

Rewrite `src/lib/trekCollection.ts` body so the fetched rows are first filtered to the section, difficulty collections only apply to `treks`, and empty results return `null`:

```ts
import { cache } from "react";
import { isPublicSupabaseConfigured, publicClient, toSlug } from "./seo";
import { sectionOf, type Section } from "./sections";

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const DIFFS = new Set(["beginner", "moderate", "difficult"]);

function toCard(t: any) {
  return {
    slug: t.slug,
    title: t.title,
    location: t.location ?? t.state ?? "",
    image: t.hero_image || "/assets/img/home2/destination-img1.jpg",
    price: Math.round((t.base_price ?? 0) / 100),
    duration: t.duration_days ? `${t.duration_days} Day${t.duration_days > 1 ? "s" : ""}` : "",
    badge: t.difficulty ? cap(t.difficulty) : null,
  };
}

export const getCollection = cache(async (slug: string, section: Section) => {
  if (!isPublicSupabaseConfigured) return null;
  const { data } = await publicClient()
    .from("treks")
    .select("slug,title,location,hero_image,base_price,duration_days,difficulty,state,region,group")
    .eq("status", "published")
    .is("deleted_at", null);
  const all = (data ?? []).filter((t: any) => sectionOf(t.group) === section);

  const byState = all.filter((t: any) => t.state && toSlug(t.state) === slug);
  if (byState.length) {
    const st = byState[0].state as string;
    return { label: `${section === "treks" ? "Treks" : "Trips"} in ${st}`, subtitle: `Across ${st} with Alpha Adventures.`, kind: "state" as const, treks: byState.map(toCard) };
  }

  if (section === "treks" && DIFFS.has(slug)) {
    const byDiff = all.filter((t: any) => t.difficulty === slug);
    if (byDiff.length) return { label: `${cap(slug)} treks`, subtitle: `Handpicked ${slug} treks for every level.`, kind: "difficulty" as const, treks: byDiff.map(toCard) };
  }

  return null;
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/trekCollection.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/trekCollection.ts src/lib/trekCollection.test.ts
git commit -m "feat: section-scoped getCollection"
```

---

## Task 3: Treks listing root `/treks`

**Files:**
- Create: `src/app/treks/page.jsx`

**Interfaces:**
- Consumes: `getListingTreks()` (`src/lib/trekListing`), `trekGroups` (`src/data/treks`), `TrekGroupSections`, `PageHero`.

- [ ] **Step 1: Create the listing page** (body copied from the current `src/app/treks/upcoming-treks/page.jsx`, with the explore links repointed to `/treks/<group>-treks`)

```jsx
// src/app/treks/page.jsx
import PageHero from "@/components/layout/PageHero";
import TrekGroupSections from "@/components/treks/TrekGroupSections";
import { trekGroups } from "@/data/treks";
import { getListingTreks } from "@/lib/trekListing";

export const metadata = { title: "Treks" };
export const revalidate = 300;

export default async function TreksPage() {
  const treks = await getListingTreks();
  const sections = ["sahyadri", "himalayan", "central"].map((key) => ({
    key,
    title: trekGroups[key].title,
    blurb: trekGroups[key].blurb,
    items: treks.filter((t) => t.group === key),
    href: `/treks/${key === "central" ? "central-india" : key}-treks`,
  }));
  return (
    <>
      <PageHero
        title="Treks"
        crumb="Treks"
        subtitle="Guided treks across the Sahyadris, the Himalayas and Central India — with guides, stays and transport sorted."
      />
      <div className="py-14">
        <TrekGroupSections sections={sections} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev`, open `http://localhost:3000/treks`.
Expected: three group sections render with cards; "Explore all …" links point to `/treks/sahyadri-treks`, `/treks/himalayan-treks`, `/treks/central-india-treks`.

- [ ] **Step 3: Commit**

```bash
git add src/app/treks/page.jsx
git commit -m "feat: /treks listing root"
```

---

## Task 4: Treks resolver `/treks/[slug]`

**Files:**
- Modify: `src/app/treks/[slug]/page.jsx`

**Interfaces:**
- Consumes: `getTrekBySlug` (`src/lib/trekDetail`), `getCollection` (Task 2), `getListingTreks`, `GROUP_ALIASES`/`canonicalPath`/`sectionOf` (Task 1), `TrekDetail`, `TrekCollection`, `TrekGrid`, `PageHero`, `trekGroups`.

- [ ] **Step 1: Rewrite the route** to resolve group-alias listing → trek detail → wrong-section 301 → collection → 404

```jsx
import { notFound, redirect } from "next/navigation";
import TrekDetail from "@/components/treks/TrekDetail";
import TrekCollection from "@/components/treks/TrekCollection";
import PageHero from "@/components/layout/PageHero";
import TrekGrid from "@/components/home/TrekGrid";
import { getTrekBySlug } from "@/lib/trekDetail";
import { getCollection } from "@/lib/trekCollection";
import { getListingTreks } from "@/lib/trekListing";
import { GROUP_ALIASES, canonicalPath, sectionOf } from "@/lib/sections";
import { trekGroups } from "@/data/treks";
import { abs, SITE_URL } from "@/lib/seo";

export const revalidate = 300;

function groupListing(slug) {
  // sahyadri-treks | himalayan-treks | central-india-treks | weekend-treks
  if (slug === "weekend-treks") return { kind: "weekend" };
  const key = GROUP_ALIASES[slug];
  return key ? { kind: "group", key } : null;
}

export async function generateMetadata({ params }) {
  const gl = groupListing(params.slug);
  if (gl?.kind === "group") return { title: trekGroups[gl.key].title };
  if (gl?.kind === "weekend") return { title: "Weekend Treks" };
  const trek = await getTrekBySlug(params.slug);
  if (trek && sectionOf(trek.group) === "treks") {
    const canonical = `/treks/${trek.slug}`;
    const desc = trek.summary ?? trek.overview?.slice(0, 155) ?? undefined;
    return { title: trek.title, description: desc, alternates: { canonical },
      openGraph: { title: trek.title, description: desc, url: abs(canonical), images: trek.hero_image ? [abs(trek.hero_image)] : undefined } };
  }
  const col = await getCollection(params.slug, "treks");
  if (col) return { title: col.label, description: col.subtitle, alternates: { canonical: `/treks/${params.slug}` } };
  return { title: "Trek" };
}

function trekJsonLd(trek) {
  const price = trek.base_price != null ? (trek.base_price / 100).toFixed(0) : undefined;
  return {
    "@context": "https://schema.org", "@type": "TouristTrip", name: trek.title,
    description: trek.overview ?? trek.summary ?? undefined,
    image: trek.hero_image ? abs(trek.hero_image) : undefined,
    url: abs(`/treks/${trek.slug}`), touristType: trek.difficulty,
    provider: { "@type": "TravelAgency", name: "Alpha Adventures", url: SITE_URL },
    ...(price && { offers: { "@type": "Offer", price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: abs(`/book/${trek.slug}`) } }),
  };
}

export default async function TrekOrCollectionPage({ params }) {
  const gl = groupListing(params.slug);
  if (gl) {
    const treks = await getListingTreks();
    const items = gl.kind === "weekend"
      ? treks.filter((t) => sectionOf(t.group) === "treks" && t.tags?.some((x) => ["beginner", "weekend", "half-day"].includes(x)))
      : treks.filter((t) => t.group === gl.key);
    const title = gl.kind === "weekend" ? "Weekend Treks" : trekGroups[gl.key].title;
    const blurb = gl.kind === "weekend" ? "Quick, beginner-friendly escapes for a perfect weekend." : trekGroups[gl.key].blurb;
    return (
      <>
        <PageHero title={title} crumb={`Treks / ${title}`} subtitle={blurb} />
        <TrekGrid treks={items} eyebrow="Treks" title={title} />
      </>
    );
  }

  const trek = await getTrekBySlug(params.slug);
  if (trek) {
    if (sectionOf(trek.group) !== "treks") redirect(canonicalPath(trek));
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trekJsonLd(trek)).replace(/</g, "\\u003c") }} />
        <TrekDetail trek={trek} />
      </>
    );
  }

  const col = await getCollection(params.slug, "treks");
  if (col) return <TrekCollection label={col.label} subtitle={col.subtitle} treks={col.treks} />;
  return notFound();
}
```

- [ ] **Step 2: Verify resolution paths**

Run with `npm run dev`:
- `http://localhost:3000/treks/sahyadri-treks` → Sahyadri group listing.
- `http://localhost:3000/treks/rajgad-fort-trek` → `TrekDetail`.
- `http://localhost:3000/treks/spiti-valley` → **307/308 redirect** to `/backpacking-trips/spiti-valley` (confirm in Network tab / `curl -sI`).
- `http://localhost:3000/treks/maharashtra` → state collection of treks.
- `http://localhost:3000/treks/atlantis` → 404.

- [ ] **Step 3: Commit**

```bash
git add "src/app/treks/[slug]/page.jsx"
git commit -m "feat: treks resolver with wrong-section 301 + group listings"
```

---

## Task 5: TrekDetail section-aware breadcrumb

**Files:**
- Modify: `src/components/treks/TrekDetail.jsx` (the breadcrumb `<nav>`, currently ~lines 50–55)

**Interfaces:**
- Consumes: `SECTION_LABEL`, `sectionHref`, `sectionOf` from `@/lib/sections`.

- [ ] **Step 1: Replace the hardcoded "Backpacking Trips" breadcrumb** with the row's real section

Add import at top:
```jsx
import { SECTION_LABEL, sectionHref, sectionOf } from "@/lib/sections";
```
Inside the component, before `return`:
```jsx
const section = sectionOf(trek.group);
```
Replace the nav body that currently links `/treks/backpacking-trips` with:
```jsx
<nav style={{ marginBottom: 12, fontSize: 14, color: "rgba(255,255,255,.8)" }}>
  <Link href="/" style={{ color: "inherit" }}>Home</Link><span className="mx-2">›</span>
  <Link href={sectionHref(section)} style={{ color: "inherit" }}>{SECTION_LABEL[section]}</Link><span className="mx-2">›</span>
  {trek.state && <><span>{trek.state}</span><span className="mx-2">›</span></>}
  <span style={{ color: "#fff" }}>{trek.title}</span>
</nav>
```

- [ ] **Step 2: Verify**

Open `http://localhost:3000/treks/rajgad-fort-trek`.
Expected: breadcrumb reads Home › Treks › Maharashtra › Rajgad Fort Trek (links to `/treks`).

- [ ] **Step 3: Commit**

```bash
git add src/components/treks/TrekDetail.jsx
git commit -m "fix: section-aware TrekDetail breadcrumb"
```

---

## Task 6: `TripDetail` Supabase adapter + parametrized breadcrumb

**Files:**
- Create: `src/lib/tripDetailProps.ts`
- Modify: `src/components/treks/TripDetail.jsx`

**Interfaces:**
- Produces: `tripDetailProps(detail)` → object consumed by `TripDetail`'s `trek` prop:
  `{ title, badge, price (rupees), description, about, image, overview: { duration, difficulty, ageGroup, highestAltitude }, gallery: string[], itinerary: [{ day, title, slots: [{time, activity}] }], inclusions: string[], exclusions: string[] }`.
  `detail` is the object returned by `getTrekBySlug`.
- `TripDetail` gains a `breadcrumb: { label, href }` prop replacing the hardcoded link.

- [ ] **Step 1: Write the adapter**

```ts
// src/lib/tripDetailProps.ts
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1) : "");

export function tripDetailProps(detail: any) {
  const durationLabel = detail.duration_days ? `${detail.duration_days} Day${detail.duration_days > 1 ? "s" : ""}` : "";
  return {
    title: detail.title,
    badge: detail.badge ?? null,
    price: Math.round((detail.base_price ?? 0) / 100),
    description: detail.summary ?? "",
    about: detail.overview ?? detail.summary ?? "",
    image: detail.hero_image || "/assets/img/home2/destination-img1.jpg",
    overview: {
      duration: durationLabel,
      difficulty: cap(detail.difficulty) || "Beginner Friendly",
      ageGroup: detail.group_size || "12-60 yrs",
      highestAltitude: detail.altitude || "—",
    },
    gallery: (detail.gallery ?? []).map((g: any) => g.image_url).filter(Boolean),
    itinerary: (detail.itinerary ?? []).map((d: any) => ({
      day: d.day_no,
      title: d.title || "",
      slots: d.description ? [{ time: "", activity: d.description }] : [],
    })),
    inclusions: detail.inclusions ?? [],
    exclusions: detail.exclusions ?? [],
  };
}
```

- [ ] **Step 2: Parametrize the breadcrumb in `TripDetail.jsx`**

Change the signature:
```jsx
export default function TripDetail({ trek, breadcrumb }) {
```
Replace the hardcoded breadcrumb link (currently `/treks/trips-near-nagpur` "Trips Near Nagpur") with:
```jsx
<Link href={breadcrumb?.href || "/"} className="hover:text-primary">{breadcrumb?.label || "Trips"}</Link>
```
Guard the gallery fallback so an empty array still shows the hero:
```jsx
const gallery = trek.gallery?.length ? trek.gallery : [trek.image];
```
(already present — keep).

- [ ] **Step 3: Commit**

```bash
git add src/lib/tripDetailProps.ts src/components/treks/TripDetail.jsx
git commit -m "feat: TripDetail Supabase adapter + parametrized breadcrumb"
```

---

## Task 7: Backpacking routes

**Files:**
- Create: `src/app/backpacking-trips/page.jsx`
- Create: `src/app/backpacking-trips/[slug]/page.jsx`

**Interfaces:**
- Consumes: `getListingTreks`, `getTrekBySlug`, `getCollection`, `tripDetailProps` (Task 6), `TripDetail`, `TrekCollection`, `TrekGrid`, `PageHero`, `canonicalPath`/`sectionOf`, `SECTION_LABEL`/`sectionHref`.

- [ ] **Step 1: Listing page**

```jsx
// src/app/backpacking-trips/page.jsx
import PageHero from "@/components/layout/PageHero";
import TrekGrid from "@/components/home/TrekGrid";
import { getListingTreks } from "@/lib/trekListing";

export const metadata = {
  title: "Backpacking Trips",
  description: "Coastal escapes, desert circuits, hill stations and Himalayan valleys — curated backpacking across India.",
};
export const revalidate = 300;

export default async function BackpackingTripsPage() {
  const treks = await getListingTreks();
  const items = treks.filter((t) => t.group === "backpacking");
  return (
    <>
      <PageHero title="Backpacking Trips" crumb="Backpacking Trips"
        subtitle="Coastal escapes, desert circuits, hill stations and Himalayan valleys — curated backpacking across India." />
      <TrekGrid treks={items} eyebrow="Backpacking" title="Backpacking Trips Across India" />
    </>
  );
}
```

- [ ] **Step 2: Detail/collection resolver**

```jsx
// src/app/backpacking-trips/[slug]/page.jsx
import { notFound, redirect } from "next/navigation";
import TripDetail from "@/components/treks/TripDetail";
import TrekCollection from "@/components/treks/TrekCollection";
import { getTrekBySlug } from "@/lib/trekDetail";
import { getCollection } from "@/lib/trekCollection";
import { tripDetailProps } from "@/lib/tripDetailProps";
import { canonicalPath, sectionOf, sectionHref, SECTION_LABEL } from "@/lib/sections";
import { abs } from "@/lib/seo";

export const revalidate = 300;
const SECTION = "backpacking-trips";

export async function generateMetadata({ params }) {
  const trek = await getTrekBySlug(params.slug);
  if (trek && sectionOf(trek.group) === SECTION) {
    const canonical = `/${SECTION}/${trek.slug}`;
    const desc = trek.summary ?? undefined;
    return { title: trek.title, description: desc, alternates: { canonical },
      openGraph: { title: trek.title, description: desc, url: abs(canonical), images: trek.hero_image ? [abs(trek.hero_image)] : undefined } };
  }
  const col = await getCollection(params.slug, SECTION);
  if (col) return { title: col.label, description: col.subtitle, alternates: { canonical: `/${SECTION}/${params.slug}` } };
  return { title: "Backpacking Trip" };
}

export default async function BackpackingDetailPage({ params }) {
  const trek = await getTrekBySlug(params.slug);
  if (trek) {
    if (sectionOf(trek.group) !== SECTION) redirect(canonicalPath(trek));
    return <TripDetail trek={tripDetailProps(trek)} breadcrumb={{ label: SECTION_LABEL[SECTION], href: sectionHref(SECTION) }} />;
  }
  const col = await getCollection(params.slug, SECTION);
  if (col) return <TrekCollection label={col.label} subtitle={col.subtitle} treks={col.treks} />;
  return notFound();
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`:
- `/backpacking-trips` → grid of backpacking trips.
- `/backpacking-trips/spiti-valley` → `TripDetail`, breadcrumb Home / Backpacking Trips / Spiti Valley.
- `/backpacking-trips/himachal-pradesh` → state collection (backpacking only).
- `/backpacking-trips/rajgad-fort-trek` (a trek) → redirect to `/treks/rajgad-fort-trek`.
- `/backpacking-trips/atlantis` → 404.

- [ ] **Step 4: Commit**

```bash
git add src/app/backpacking-trips
git commit -m "feat: /backpacking-trips listing + resolver"
```

---

## Task 8: Trips-near-Nagpur routes

**Files:**
- Create: `src/app/trips-near-nagpur/page.jsx`
- Create: `src/app/trips-near-nagpur/[slug]/page.jsx`

**Interfaces:** same as Task 7 with `SECTION = "trips-near-nagpur"`; no collection step (all near Nagpur).

- [ ] **Step 1: Listing page**

```jsx
// src/app/trips-near-nagpur/page.jsx
import PageHero from "@/components/layout/PageHero";
import TrekGrid from "@/components/home/TrekGrid";
import { getListingTreks } from "@/lib/trekListing";

export const metadata = { title: "Trips Near Nagpur" };
export const revalidate = 300;

export default async function TripsNearNagpurPage() {
  const treks = await getListingTreks();
  const items = treks.filter((t) => t.group === "near-nagpur");
  return (
    <>
      <PageHero title="Trips Near Nagpur" crumb="Trips Near Nagpur"
        subtitle="Quick weekend getaways, hidden waterfalls and riverside camping — all close to Nagpur." />
      <TrekGrid treks={items} eyebrow="Near Nagpur" title="Weekend Escapes From Nagpur" />
    </>
  );
}
```

- [ ] **Step 2: Detail resolver** (no collection)

```jsx
// src/app/trips-near-nagpur/[slug]/page.jsx
import { notFound, redirect } from "next/navigation";
import TripDetail from "@/components/treks/TripDetail";
import { getTrekBySlug } from "@/lib/trekDetail";
import { tripDetailProps } from "@/lib/tripDetailProps";
import { canonicalPath, sectionOf, sectionHref, SECTION_LABEL } from "@/lib/sections";
import { abs } from "@/lib/seo";

export const revalidate = 300;
const SECTION = "trips-near-nagpur";

export async function generateMetadata({ params }) {
  const trek = await getTrekBySlug(params.slug);
  if (trek && sectionOf(trek.group) === SECTION) {
    const canonical = `/${SECTION}/${trek.slug}`;
    return { title: trek.title, description: trek.summary ?? undefined, alternates: { canonical },
      openGraph: { title: trek.title, url: abs(canonical), images: trek.hero_image ? [abs(trek.hero_image)] : undefined } };
  }
  return { title: "Trip Near Nagpur" };
}

export default async function NearNagpurDetailPage({ params }) {
  const trek = await getTrekBySlug(params.slug);
  if (!trek) return notFound();
  if (sectionOf(trek.group) !== SECTION) redirect(canonicalPath(trek));
  return <TripDetail trek={tripDetailProps(trek)} breadcrumb={{ label: SECTION_LABEL[SECTION], href: sectionHref(SECTION) }} />;
}
```

- [ ] **Step 3: Verify**

- `/trips-near-nagpur` → grid.
- `/trips-near-nagpur/silver-falls` → `TripDetail`.
- `/trips-near-nagpur/spiti-valley` → redirect to `/backpacking-trips/spiti-valley`.
- `/trips-near-nagpur/atlantis` → 404.

- [ ] **Step 4: Commit**

```bash
git add src/app/trips-near-nagpur
git commit -m "feat: /trips-near-nagpur listing + resolver"
```

---

## Task 9: Remove old nested routes + add redirects

**Files:**
- Delete: `src/app/treks/upcoming-treks/`, `src/app/treks/backpacking-trips/`, `src/app/treks/trips-near-nagpur/`
- Modify: `next.config.mjs` `redirects()`

- [ ] **Step 1: Delete the old route dirs**

```bash
git rm -r src/app/treks/upcoming-treks "src/app/treks/backpacking-trips" "src/app/treks/trips-near-nagpur"
```

- [ ] **Step 2: Replace the `redirects()` return array** in `next.config.mjs`

```js
async redirects() {
  const guides = ["packing-checklist", "fitness-requirements", "beginner-trek-guide", "safety-guidelines", "responsible-travel"];
  return [
    // old nested listings -> flat sections
    { source: "/treks/upcoming-treks", destination: "/treks", permanent: true },
    { source: "/treks/upcoming-treks/:group", destination: "/treks/:group", permanent: true },
    { source: "/treks/backpacking-trips", destination: "/backpacking-trips", permanent: true },
    { source: "/treks/backpacking-trips/:rest*", destination: "/backpacking-trips/:rest*", permanent: true },
    { source: "/treks/trips-near-nagpur", destination: "/trips-near-nagpur", permanent: true },
    { source: "/treks/trips-near-nagpur/:rest*", destination: "/trips-near-nagpur/:rest*", permanent: true },
    // legacy PHP-era detail URLs -> new canonicals
    { source: "/backpacking-trips/detail/spiti-backpacking-trip", destination: "/backpacking-trips/spiti-valley", permanent: true },
    { source: "/backpacking-trips/detail/:slug", destination: "/backpacking-trips/:slug", permanent: true },
    { source: "/trips-near-nagpur/detail/:slug", destination: "/trips-near-nagpur/:slug", permanent: true },
    ...guides.map((g) => ({ source: `/${g}`, destination: `/guides/${g}`, permanent: true })),
  ];
},
```

- [ ] **Step 3: Verify redirects** (redirects need a server restart)

```bash
curl -sI "http://localhost:3000/treks/backpacking-trips/madhya-pradesh" | grep -i location
```
Expected: `location: /backpacking-trips/madhya-pradesh`. Also check `/treks/upcoming-treks` → `/treks`.

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs
git commit -m "feat: redirect old nested trek URLs to flat sections"
```

---

## Task 10: Rewrite nav + footer links

**Files:**
- Modify: `src/data/orig-header.html`
- Modify: `src/data/orig-footer.html`

- [ ] **Step 1: Repoint nav links** to the four clean roots and strip junk suffixes. In both files, apply:
  - `/upcoming-treks` → `/treks`; `/upcoming-treks/sahyadri-treks` → `/treks/sahyadri-treks` (same for himalayan-treks, central-india-treks); `/upcoming-treks/:group/:state` style deep links → `/treks/:state`.
  - `/backpacking-trips/<state>-<digits>` → `/backpacking-trips/<state>` (drop the `-1781965392` suffix); nested `/backpacking-trips/<state>/<slug>` → `/backpacking-trips/<slug>`.
  - `/trips-near-nagpur/...` already flat — leave.

Run this normalization from the repo root, then eyeball the diff:
```bash
sed -i -E \
  -e 's#/upcoming-treks#/treks#g' \
  -e 's#(/backpacking-trips/[a-z-]+)-[0-9]+#\1#g' \
  src/data/orig-header.html src/data/orig-footer.html
```
Then manually collapse any remaining `/backpacking-trips/<state>/<trip-slug>` hrefs to `/backpacking-trips/<trip-slug>` and any `/treks/<group>-treks/<state>` to `/treks/<state>` (grep for a second path segment).

- [ ] **Step 2: Verify no stale/nested or junk links remain**

```bash
grep -nE 'upcoming-treks|-17819|/treks/backpacking|backpacking-trips/[a-z-]+/[a-z]' src/data/orig-header.html src/data/orig-footer.html || echo "clean"
```
Expected: `clean`.

- [ ] **Step 3: Verify in browser** — header/footer nav links on `/` all resolve (200 or intended 301), no 404.

- [ ] **Step 4: Commit**

```bash
git add src/data/orig-header.html src/data/orig-footer.html
git commit -m "fix: nav/footer to flat section URLs, drop junk slug suffixes"
```

---

## Task 11: Sitemap per-section URLs

**Files:**
- Modify: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: `getListingTreks` (has `group`; **state added in Step 0**), `canonicalPath`, `sectionOf` (Task 1), existing `abs`/`toSlug`.

- [ ] **Step 0: Add `state` to the listing shape** (sitemap collections need it). In `src/lib/trekListing.ts`: add `state: string | null;` to the `ListingTrek` type, add `state` to the `.select(...)` string, and map `state: t.state` in the returned object.

- [ ] **Step 1: Replace trek + static entries** so details use `canonicalPath` and collections are per-section

Change the static listing lines from the three `/treks/*` nested paths to:
```ts
["/treks", 0.7], ["/backpacking-trips", 0.7], ["/trips-near-nagpur", 0.7],
```
Replace the trek-detail + collection blocks with:
```ts
import { getListingTreks } from "@/lib/trekListing";
import { canonicalPath, sectionOf } from "@/lib/sections";
// ...
const listing = await getListingTreks();
const trekEntries: MetadataRoute.Sitemap = listing.map((t) => ({
  url: abs(canonicalPath(t)),
  lastModified: now,
  changeFrequency: "weekly",
  priority: 0.8,
}));
// state collections, per section
const seen = new Set<string>();
const collectionEntries: MetadataRoute.Sitemap = [];
for (const t of listing) {
  if (!t.state) continue;
  const path = `/${sectionOf(t.group)}/${toSlug(t.state)}`;
  if (seen.has(path)) continue;
  seen.add(path);
  collectionEntries.push({ url: abs(path), lastModified: now, changeFrequency: "weekly", priority: 0.7 });
}
```
(Keep difficulty collections only under `/treks` if desired; optional.)

- [ ] **Step 2: Verify**

Open `http://localhost:3000/sitemap.xml`.
Expected: detail URLs are `/backpacking-trips/...`, `/trips-near-nagpur/...`, `/treks/...` per group; no `/treks/backpacking-trips` entries.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: sitemap emits flat per-section URLs"
```

---

## Task 12: Full build + regression sweep

**Files:** none (verification task)

- [ ] **Step 1: Typecheck + unit tests**

Run: `npm run typecheck && npx vitest run src/lib/sections.test.ts src/lib/trekCollection.test.ts`
Expected: clean, all tests pass.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: builds with no missing-route or type errors.

- [ ] **Step 3: Redirect + route smoke test** (dev or built server)

```bash
for u in /treks /treks/sahyadri-treks /backpacking-trips /trips-near-nagpur /treks/rajgad-fort-trek /backpacking-trips/spiti-valley /trips-near-nagpur/silver-falls; do
  echo "$u -> $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$u)"; done
for u in /treks/upcoming-treks /treks/backpacking-trips/madhya-pradesh /treks/spiti-valley; do
  echo "$u -> $(curl -sI http://localhost:3000$u | grep -i ^location)"; done
```
Expected: first group all 200; second group all redirect to the new canonical paths.

- [ ] **Step 4: Commit (if any fixups needed)**

```bash
git add -A && git commit -m "chore: IA restructure regression fixups"
```
