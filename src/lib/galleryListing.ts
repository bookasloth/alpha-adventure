import { cache } from "react";
import { publicClient } from "@/lib/seo";

export type GalleryAlbum = {
  slug: string;
  title: string;
  subtitle: string | null;
  hero: string | null;
  hero_alt: string | null;
  /** Display label for the trip type, e.g. "Moderate · Trek". */
  trip_type: string | null;
};

const SELECT = "slug,title,subtitle,hero,hero_alt";

const KIND_LABEL: Record<string, string> = {
  trek: "Trek",
  backpacking: "Backpacking",
  tour: "Tour",
};

/** Merge trek kind/difficulty onto albums (matched by slug) for the card type label. */
async function withTripType(albums: { slug: string; subtitle: string | null }[]): Promise<Map<string, string | null>> {
  const slugs = albums.map((a) => a.slug);
  if (slugs.length === 0) return new Map();
  const supabase = publicClient();
  const { data } = await supabase
    .from("treks")
    .select("slug,kind,difficulty")
    .in("slug", slugs)
    .eq("status", "published")
    .is("deleted_at", null);
  const map = new Map<string, string | null>();
  for (const t of data ?? []) {
    const kind = KIND_LABEL[t.kind] ?? "Trip";
    const parts = t.difficulty ? [t.difficulty[0].toUpperCase() + t.difficulty.slice(1), kind] : [kind];
    map.set(t.slug, parts.join(" · "));
  }
  return map;
}

/** Slug/title heuristic for albums with no matching trek row. */
function fallbackType(slug: string): string {
  if (slug.includes("tour")) return "Tour";
  if (slug.endsWith("-trek")) return "Trek";
  return "Trip";
}

export async function getGalleryAlbums(): Promise<GalleryAlbum[]> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("gallery_albums")
    .select(SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("sort")
    .order("title");
  const albums = (data ?? []) as Omit<GalleryAlbum, "trip_type">[];
  const types = await withTripType(albums);
  return albums.map((a) => ({ ...a, trip_type: a.subtitle ?? types.get(a.slug) ?? fallbackType(a.slug) }));
}

// React.cache: called from generateMetadata and the page body - dedupe.
export const getGalleryAlbum = cache(loadGalleryAlbum);
async function loadGalleryAlbum(slug: string): Promise<GalleryAlbum | null> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("gallery_albums")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  const album = (data ?? null) as Omit<GalleryAlbum, "trip_type"> | null;
  if (!album) return null;
  const types = await withTripType([album]);
  return { ...album, trip_type: album.subtitle ?? types.get(album.slug) ?? fallbackType(album.slug) };
}
