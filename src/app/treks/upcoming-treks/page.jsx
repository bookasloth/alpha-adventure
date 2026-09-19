import PageHero from "@/components/layout/PageHero";
import TrekGroupSections from "@/components/treks/TrekGroupSections";
import { treks, trekGroups } from "@/data/treks";

export const metadata = { title: "Upcoming Treks" };

export default function UpcomingTreksPage() {
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
