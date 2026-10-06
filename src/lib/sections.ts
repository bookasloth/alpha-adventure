// Section IA spine: maps the single `treks` table's `group` column to the four
// top-level product sections. Pure, no I/O — the one source of truth for which
// section a row belongs to, its canonical URL, and the treks group-listing
// aliases. See docs/superpowers/specs/2026-10-04-section-ia-restructure-design.md.

export type Section = "treks" | "backpacking-trips" | "trips-near-nagpur";

// group (DB column) -> section. Unlisted groups fall back to "treks".
export const GROUP_TO_SECTION: Record<string, Section> = {
  sahyadri: "treks",
  himalayan: "treks",
  central: "treks",
  backpacking: "backpacking-trips",
  "near-nagpur": "trips-near-nagpur",
};

export const SECTION_META: Record<Section, { label: string; href: string }> = {
  treks: { label: "Treks", href: "/treks" },
  "backpacking-trips": { label: "Backpacking Trips", href: "/backpacking-trips" },
  "trips-near-nagpur": { label: "Trips Near Nagpur", href: "/trips-near-nagpur" },
};

export function sectionOf(group: string | null | undefined): Section | null {
  if (!group) return null;
  return GROUP_TO_SECTION[group] ?? null;
}

// Canonical URL for a row. Unknown group -> /treks/<slug> (safe default).
export function canonicalPath(row: { group: string | null | undefined; slug: string }): string {
  const section = sectionOf(row.group) ?? "treks";
  return `/${section}/${row.slug}`;
}

// Treks-section group-listing slugs <-> group key. Shared by the /treks root
// (renders all groups) and /treks/<segment> (renders one group).
export const GROUP_ALIASES: Record<string, string> = {
  "sahyadri-treks": "sahyadri",
  "himalayan-treks": "himalayan",
  "central-india-treks": "central",
};
