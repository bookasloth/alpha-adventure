import type { MetadataRoute } from "next";
import { abs, listPublishedTreks, toSlug } from "@/lib/seo";
import { canonicalPath, sectionOf, type Section } from "@/lib/sections";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const treks = await listPublishedTreks();

  const staticPaths = [
    ["/", 1.0], ["/gallery", 0.6],
    ["/about-us", 0.6], ["/contact", 0.6], ["/travel-calendar", 0.5], ["/shop", 0.5],
    ["/corporate-programmes", 0.5], ["/student-programmes", 0.5],
    // Four flat sections + treks group listings.
    ["/treks", 0.7], ["/backpacking-trips", 0.7], ["/trips-near-nagpur", 0.7], ["/tour-packages", 0.8],
    ["/treks/sahyadri-treks", 0.6], ["/treks/himalayan-treks", 0.6], ["/treks/central-india-treks", 0.6],
    ["/guides/packing-checklist", 0.5], ["/guides/fitness-requirements", 0.5],
    ["/guides/beginner-trek-guide", 0.5], ["/guides/safety-guidelines", 0.5], ["/guides/responsible-travel", 0.5],
    ["/terms-and-conditions", 0.3], ["/cancellation-policy", 0.3],
  ] as const;

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(([p, priority]) => ({
    url: abs(p), lastModified: now, changeFrequency: "weekly", priority,
  }));

  // Detail pages, section-canonical (/treks/… , /backpacking-trips/… , …).
  const trekEntries: MetadataRoute.Sitemap = treks.map((t) => ({
    url: abs(canonicalPath({ group: t.group, slug: t.slug })),
    lastModified: t.updated_at ? new Date(t.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // State collections, scoped per section (/<section>/<state-slug>); difficulty
  // collections only under /treks.
  const collectionPaths = new Set<string>();
  for (const t of treks) {
    const section = (sectionOf(t.group) ?? "treks") as Section;
    if (t.state) collectionPaths.add(`/${section}/${toSlug(t.state)}`);
    if (section === "treks" && t.difficulty) collectionPaths.add(`/treks/${t.difficulty}`);
  }
  const collectionEntries: MetadataRoute.Sitemap = [...collectionPaths].map((p) => ({
    url: abs(p), lastModified: now, changeFrequency: "weekly", priority: 0.7,
  }));

  return [...staticEntries, ...trekEntries, ...collectionEntries];
}
