import { notFound, redirect } from "next/navigation";
import TrekDetail from "@/components/treks/TrekDetail";
import TrekCollection from "@/components/treks/TrekCollection";
import { trekJsonLd } from "@/lib/trekDetail";
import { getCollection } from "@/lib/trekCollection";
import { resolveSectionItem } from "@/lib/sectionRoute";
import { abs } from "@/lib/seo";

export const revalidate = 300;
// Empty list = nothing prebuilt at deploy, but each slug is rendered once on
// first visit and then served from cache (ISR) until revalidate/admin edits.
// Without this the route renders on every request.
export async function generateStaticParams() {
  return [];
}

const SECTION = "backpacking-trips";

export async function generateMetadata(props) {
  const params = await props.params;
  const hit = await resolveSectionItem(SECTION, params.slug);
  if (hit?.trek) {
    const trek = hit.trek;
    const canonical = `/${SECTION}/${trek.slug}`;
    const desc = trek.summary ?? trek.overview?.slice(0, 155) ?? undefined;
    return {
      title: trek.title,
      description: desc,
      alternates: { canonical },
      openGraph: { title: trek.title, description: desc, url: abs(canonical), images: trek.hero_image ? [abs(trek.hero_image)] : undefined },
    };
  }
  const col = await getCollection(params.slug, SECTION);
  if (col) {
    const canonical = `/${SECTION}/${params.slug}`;
    return { title: col.label, description: col.subtitle, alternates: { canonical } };
  }
  return { title: "Backpacking Trips" };
}

export default async function BackpackingDetailPage(props) {
  const params = await props.params;
  const hit = await resolveSectionItem(SECTION, params.slug);
  if (hit?.redirectTo) redirect(hit.redirectTo);
  if (hit?.trek) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trekJsonLd(hit.trek)).replace(/</g, "\\u003c") }} />
        <TrekDetail trek={hit.trek} />
      </>
    );
  }
  const col = await getCollection(params.slug, SECTION);
  if (col) return <TrekCollection label={col.label} subtitle={col.subtitle} treks={col.treks} />;
  return notFound();
}
