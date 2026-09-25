import PageHero from "@/components/layout/PageHero";
import TrekGroupSections from "@/components/treks/TrekGroupSections";
import { trekGroups } from "@/data/treks";
import { getListingTreks } from "@/lib/trekListing";

export const metadata = { title: "Upcoming Treks" };
export const dynamic = "force-dynamic";

export default async function UpcomingTreksPage() {
  const treks = await getListingTreks();
  const sections = ["sahyadri", "himalayan", "central"].map((key) => ({
    key,
    title: trekGroups[key].title,
    blurb: trekGroups[key].blurb,
    items: treks.filter((t) => t.group === key),
    href: `/treks/upcoming-treks/${key}-treks`,
  }));

  return (
    <>
      <PageHero
        title="Upcoming Treks"
        crumb="Upcoming Treks"
        subtitle="Handpicked batches across the Sahyadris, the Himalayas and Central India — with guides, stays and transport sorted."
      />
      <div className="py-14">
        <TrekGroupSections sections={sections} />
      </div>
    </>
  );
}
