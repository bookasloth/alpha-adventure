import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Card shape the listing components (TrekCard / TrekGrid / TrekGroupSections)
// expect, mapped from the treks table. `group`/`tags` are kept so pages can
// filter into sections the same way the old static data did.
export type ListingTrek = {
  slug: string;
  title: string;
  location: string | null;
  duration: string | null;
  price: number; // rupees
  badge: string | null;
  image: string | null;
  href: string;
  group: string | null;
  tags: string[];
  featured: boolean;
};

// All published treks, mapped for listing pages. RLS (anon) already limits to
// published, non-deleted rows; the extra filters are belt-and-suspenders.
export async function getListingTreks(): Promise<ListingTrek[]> {
  const supabase = createClient(cookies());
  const { data } = await supabase
    .from("treks")
    .select("slug,title,location,duration_label,base_price,badge,hero_image,group,tags,featured")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("title");

  return (data ?? []).map((t) => ({
    slug: t.slug,
    title: t.title,
    location: t.location,
    duration: t.duration_label,
    price: Math.round((t.base_price ?? 0) / 100),
    badge: t.badge,
    image: t.hero_image,
    href: `/treks/${t.slug}`,
    group: t.group,
    tags: t.tags ?? [],
    featured: !!t.featured,
  }));
}

// Treks for the homepage "Popular Treks" slider: featured first, then the rest.
export async function getHomeTreks(limit = 8): Promise<ListingTrek[]> {
  const all = await getListingTreks();
  return [...all].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, limit);
}
