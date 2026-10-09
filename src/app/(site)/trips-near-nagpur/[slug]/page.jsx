import { notFound, redirect } from "next/navigation";
import TrekDetail from "@/components/treks/TrekDetail";
import { trekJsonLd } from "@/lib/trekDetail";
import { resolveSectionItem } from "@/lib/sectionRoute";
import { abs } from "@/lib/seo";

export const revalidate = 300;
// Empty list = nothing prebuilt at deploy, but each slug is rendered once on
// first visit and then served from cache (ISR) until revalidate/admin edits.
// Without this the route renders on every request.
export async function generateStaticParams() {
  return [];
}

const SECTION = "trips-near-nagpur";

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
  return { title: "Trips Near Nagpur" };
}

export default async function NearNagpurDetailPage(props) {
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
  // No sub-listings under this section.
  return notFound();
}
