import { cache } from "react";
import { publicClient, abs, SITE_URL } from "@/lib/seo";
import { canonicalPath } from "@/lib/sections";

// Public read of a trek + all detail sections. Anon key + RLS (published,
// non-deleted). Returns null when not found so the page can 404.
// Wrapped in React.cache: the detail page calls this in generateMetadata AND in
// the body — cache dedupes them into one fetch per request (~14 → 7 round-trips).
export const getTrekBySlug = cache(async (slug: string) => {
  const supabase = publicClient();

  const { data: trek } = await supabase
    .from("treks")
    .select(
      "id,slug,title,summary,overview,location,state,region,difficulty,duration_days,base_price,altitude,base_camp,best_season,group_size,hero_image,group",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (!trek) return null;

  // Children fetched in parallel; each ordered for stable render.
  const [itinerary, inclusions, exclusions, packages, gallery, faqs] = await Promise.all([
    supabase.from("itinerary_days").select("day_no,title,description,image").eq("trek_id", trek.id).order("day_no"),
    supabase.from("inclusions").select("text").eq("trek_id", trek.id).order("sort"),
    supabase.from("exclusions").select("text").eq("trek_id", trek.id).order("sort"),
    supabase.from("pricing_packages").select("name,price,inclusions,cta_label").eq("trek_id", trek.id).order("sort"),
    supabase.from("trek_gallery").select("image_url,caption").eq("trek_id", trek.id).order("sort_order"),
    supabase.from("trek_faqs").select("question,answer").eq("trek_id", trek.id).order("sort"),
  ]);

  return {
    ...trek,
    itinerary: itinerary.data ?? [],
    inclusions: (inclusions.data ?? []).map((r) => r.text),
    exclusions: (exclusions.data ?? []).map((r) => r.text),
    packages: packages.data ?? [],
    gallery: gallery.data ?? [],
    faqs: faqs.data ?? [],
  };
});

export type TrekDetailData = NonNullable<Awaited<ReturnType<typeof getTrekBySlug>>>;

// schema.org TouristTrip JSON-LD for a detail page. URL is section-canonical.
export function trekJsonLd(trek: TrekDetailData) {
  const path = canonicalPath({ group: trek.group, slug: trek.slug });
  const price = trek.base_price != null ? (trek.base_price / 100).toFixed(0) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trek.title,
    description: trek.overview ?? trek.summary ?? undefined,
    image: trek.hero_image ? abs(trek.hero_image) : undefined,
    url: abs(path),
    touristType: trek.difficulty,
    provider: { "@type": "TravelAgency", name: "Alpha Adventures", url: SITE_URL },
    ...(price && {
      offers: { "@type": "Offer", price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: abs(`/book/${trek.slug}`) },
    }),
  };
}
