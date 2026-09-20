import { publicClient, toSlug } from "./seo";

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const DIFFS = new Set(["beginner", "moderate", "difficult"]);

// Map a Supabase trek row to the shape TrekCard expects.
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

// Resolve a /treks/<slug> that isn't a trek: is it a state or difficulty
// collection? Returns the listing, or null (→ 404).
export async function getCollection(slug: string) {
  const { data } = await publicClient()
    .from("treks")
    .select("slug,title,location,hero_image,base_price,duration_days,difficulty,state,region")
    .eq("status", "published")
    .is("deleted_at", null);
  const treks = data ?? [];

  const byState = treks.filter((t) => t.state && toSlug(t.state) === slug);
  if (byState.length) {
    const st = byState[0].state as string;
    return { label: `Treks in ${st}`, subtitle: `Guided treks across ${st} with Alpha Adventures.`, kind: "state" as const, treks: byState.map(toCard) };
  }

  if (DIFFS.has(slug)) {
    const byDiff = treks.filter((t) => t.difficulty === slug);
    if (byDiff.length) return { label: `${cap(slug)} treks`, subtitle: `Handpicked ${slug} treks for every level.`, kind: "difficulty" as const, treks: byDiff.map(toCard) };
  }

  return null;
}
