import { cache } from "react";
import { publicClient, abs, SITE_URL } from "@/lib/seo";
import { canonicalPath } from "@/lib/sections";

// Public read of a trek + all detail sections. Anon key + RLS (published,
// non-deleted). Returns null when not found so the page can 404.
// Wrapped in React.cache: the detail page calls this in generateMetadata AND in
// the body — cache dedupes them into one fetch per request (~14 → 7 round-trips).
export const getTrekBySlug = cache(async (slug: string) => {
  const supabase = publicClient();

  const baseCols =
    "id,slug,title,summary,overview,location,state,region,difficulty,duration_days,base_price,altitude,base_camp,best_season,group_size,hero_image,group";
  const extraCols = ",not_to_miss,brochure_url,suitable_age,accommodation,fitness_criteria";

  // Prefer the extended select; if migration 0027 isn't applied yet the API
  // returns 42703 (undefined column) — fall back so the page still renders.
  const baseQuery = () =>
    supabase
      .from("treks")
      .select(baseCols)
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

  // Dynamic select strings break supabase-js inference — cast to the row shape.
  type TrekRow = {
    id: string;
    slug: string;
    title: string;
    group: string | null;
    summary: string | null;
    overview: string | null;
    hero_image: string | null;
    difficulty: string | null;
    base_price: number | null;
    not_to_miss: string[] | null;
    brochure_url: string | null;
    suitable_age: string | null;
    accommodation: string | null;
    fitness_criteria: string | null;
  };

  let { data, error } = await supabase
    .from("treks")
    .select(baseCols + extraCols)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  let trek = data as TrekRow | null;

  if (error?.code === "42703") {
    const retry = await baseQuery();
    trek = retry.data
      ? {
          ...retry.data,
          not_to_miss: [],
          brochure_url: null,
          suitable_age: null,
          accommodation: null,
          fitness_criteria: null,
        }
      : null;
  }

  if (!trek) return null;

  // Children fetched in parallel; each ordered for stable render.
  const baseDayCols = "day_no,title,description,image";
  const extraDayCols = ",trek_distance,trek_duration,drive_distance,drive_duration,altitude_gain,altitude_loss,meals";
  const postCols = "slug,title,excerpt,published_at";
  const [itinerary, inclusions, exclusions, packages, gallery, faqs, relevant, linkedPosts] =
    await Promise.all([
      supabase
        .from("itinerary_days")
        .select(baseDayCols + extraDayCols)
        .eq("trek_id", trek.id)
        .order("day_no"),
      supabase.from("inclusions").select("text").eq("trek_id", trek.id).order("sort"),
      supabase.from("exclusions").select("text").eq("trek_id", trek.id).order("sort"),
      supabase.from("pricing_packages").select("name,price,inclusions,cta_label").eq("trek_id", trek.id).order("sort"),
      supabase.from("trek_gallery").select("image_url,caption").eq("trek_id", trek.id).order("sort_order"),
      supabase.from("trek_faqs").select("question,answer").eq("trek_id", trek.id).order("sort"),
      supabase
        .from("treks")
        .select("slug,title,location,state,base_price,duration_days,hero_image,badge,group")
        .eq("status", "published")
        .is("deleted_at", null)
        .eq("group", trek.group)
        .neq("id", trek.id)
        .order("featured", { ascending: false })
        .limit(3),
      supabase
        .from("posts")
        .select(postCols)
        .eq("trek_id", trek.id)
        .eq("status", "published")
        .is("deleted_at", null)
        .order("published_at", { ascending: false })
        .limit(3),
    ]);

  // Blog: posts linked to this trek, else the latest published stories.
  let posts = linkedPosts.data;
  if (!posts || posts.length === 0) {
    const recent = await supabase
      .from("posts")
      .select(postCols)
      .eq("status", "published")
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(3);
    posts = recent.data;
  }

  // If the extended day columns are missing (0027 not applied), use the base rows.
  type DayRow = { day_no: number; title: string; description: string | null; image: string | null };
  let dayRows = itinerary.data as DayRow[] | null;
  if (itinerary.error?.code === "42703") {
    const retry = await supabase
      .from("itinerary_days")
      .select(baseDayCols)
      .eq("trek_id", trek.id)
      .order("day_no");
    dayRows = retry.data as DayRow[] | null;
  }

  return {
    ...trek,
    itinerary: dayRows ?? [],
    inclusions: (inclusions.data ?? []).map((r) => r.text),
    exclusions: (exclusions.data ?? []).map((r) => r.text),
    packages: packages.data ?? [],
    gallery: gallery.data ?? [],
    faqs: faqs.data ?? [],
    relevant: relevant.data ?? [],
    posts: posts ?? [],
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
