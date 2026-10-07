import { notFound, redirect } from "next/navigation";
import TrekDetail from "@/components/treks/TrekDetail";
import { trekJsonLd } from "@/lib/trekDetail";
import { resolveSectionItem } from "@/lib/sectionRoute";
import { abs } from "@/lib/seo";

export const revalidate = 300;

const SECTION = "trips-near-nagpur";

export async function generateMetadata({ params }) {
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

export default async function NearNagpurDetailPage({ params }) {
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
