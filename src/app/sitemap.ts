import type { MetadataRoute } from "next";
import { abs, listPublishedTreks, toSlug } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const treks = await listPublishedTreks();

  const staticPaths = [
    ["/", 1.0], ["/tour-packages", 0.8], ["/gallery", 0.6],
    ["/about-us", 0.6], ["/contact", 0.6], ["/travel-calendar", 0.5], ["/shop", 0.5],
    ["/corporate-programmes", 0.5], ["/student-programmes", 0.5],
    ["/treks/upcoming-treks", 0.7], ["/treks/backpacking-trips", 0.7], ["/treks/trips-near-nagpur", 0.7],
    ["/guides/packing-checklist", 0.5], ["/guides/fitness-requirements", 0.5],
    ["/guides/beginner-trek-guide", 0.5], ["/guides/safety-guidelines", 0.5], ["/guides/responsible-travel", 0.5],
    ["/terms-and-conditions", 0.3], ["/cancellation-policy", 0.3],
  ] as const;

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(([p, priority]) => ({
    url: abs(p), lastModified: now, changeFrequency: "weekly", priority,
  }));

  // Trek detail pages (canonical, flat).
  const trekEntries: MetadataRoute.Sitemap = treks.map((t) => ({
    url: abs(`/treks/${t.slug}`),
    lastModified: t.updated_at ? new Date(t.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Geo + difficulty collection pages, derived from live data.
  const states = [...new Set(treks.map((t) => t.state).filter(Boolean) as string[])];
  const diffs = [...new Set(treks.map((t) => t.difficulty).filter(Boolean) as string[])];
  const collectionEntries: MetadataRoute.Sitemap = [...states.map(toSlug), ...diffs].map((slug) => ({
    url: abs(`/treks/${slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.7,
  }));

  return [...staticEntries, ...trekEntries, ...collectionEntries];
}
