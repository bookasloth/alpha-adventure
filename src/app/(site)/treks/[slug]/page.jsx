import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/layout/PageHero";
import TrekGrid from "@/components/home/TrekGrid";
import TrekDetail from "@/components/treks/TrekDetail";
import TrekCollection from "@/components/treks/TrekCollection";
import { trekGroups } from "@/data/treks";
import { getListingTreks } from "@/lib/trekListing";
import { trekJsonLd } from "@/lib/trekDetail";
import { getCollection } from "@/lib/trekCollection";
import { resolveSectionItem } from "@/lib/sectionRoute";
import { GROUP_ALIASES } from "@/lib/sections";
import { abs } from "@/lib/seo";

export const revalidate = 300;

const SECTION = "treks";
const WEEKEND_TAGS = ["beginner", "weekend", "half-day"];

// /treks/[slug] resolves, in order: a group-alias listing (sahyadri-treks…) or
// weekend-treks tag listing → a trek detail (treks-group item) → a wrong-section
// 301 → a state/difficulty collection → 404.

export async function generateMetadata({ params }) {
  const { slug } = params;
  const groupKey = GROUP_ALIASES[slug];
  if (groupKey) return { title: trekGroups[groupKey].title };
  if (slug === "weekend-treks") return { title: "Weekend Treks" };

  const hit = await resolveSectionItem(SECTION, slug);
  if (hit?.trek) {
    const trek = hit.trek;
    const canonical = `/treks/${trek.slug}`;
    const desc = trek.summary ?? trek.overview?.slice(0, 155) ?? undefined;
    return {
      title: trek.title,
      description: desc,
      alternates: { canonical },
      openGraph: { title: trek.title, description: desc, url: abs(canonical), images: trek.hero_image ? [abs(trek.hero_image)] : undefined },
    };
  }
  const col = await getCollection(slug, SECTION);
  if (col) return { title: col.label, description: col.subtitle, alternates: { canonical: `/treks/${slug}` } };
  return { title: "Trek" };
}

export default async function TrekPage({ params }) {
  const { slug } = params;

  // Group-alias + weekend listings (treks only).
  const groupKey = GROUP_ALIASES[slug];
  if (groupKey) {
    const items = (await getListingTreks()).filter((t) => t.group === groupKey);
    const g = trekGroups[groupKey];
    return (
      <>
        <PageHero title={g.title} crumb={`Treks / ${g.title}`} subtitle={g.blurb} />
        <TrekGrid treks={items} eyebrow={g.title} title={g.title} subtitle={g.blurb} />
      </>
    );
  }
  if (slug === "weekend-treks") {
    const weekend = (await getListingTreks()).filter((t) => t.tags?.some((tag) => WEEKEND_TAGS.includes(tag)));
    return (
      <>
        <PageHero title="Weekend Treks" crumb="Treks / Weekend Treks" subtitle="Quick, beginner-friendly escapes for a perfect weekend." />
        <TrekGrid treks={weekend} eyebrow="Weekend" title="Weekend Friendly Treks" />
      </>
    );
  }

  // Item detail / wrong-section redirect.
  const hit = await resolveSectionItem(SECTION, slug);
  if (hit?.redirectTo) redirect(hit.redirectTo);
  if (hit?.trek) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trekJsonLd(hit.trek)).replace(/</g, "\\u003c") }} />
        <TrekDetail trek={hit.trek} />
      </>
    );
  }

  // State / difficulty collection.
  const col = await getCollection(slug, SECTION);
  if (col) return <TrekCollection label={col.label} subtitle={col.subtitle} treks={col.treks} />;
  return notFound();
}
