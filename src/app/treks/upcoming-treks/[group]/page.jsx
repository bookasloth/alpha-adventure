import { notFound } from "next/navigation";
import PageHero from "@/components/layout/PageHero";
import TrekGrid from "@/components/home/TrekGrid";
import { treks, trekGroups } from "@/data/treks";

const SLUG_TO_GROUP = {
  "sahyadri-treks": "sahyadri",
  "himalayan-treks": "himalayan",
  "central-india-treks": "central",
};

export function generateStaticParams() {
  return Object.keys(SLUG_TO_GROUP).map((slug) => ({ group: slug }));
}

export function generateMetadata({ params }) {
  const key = SLUG_TO_GROUP[params.group];
  return { title: key ? trekGroups[key].title : "Treks" };
}

export default function TrekGroupPage({ params }) {
  const { group } = params;
  const key = SLUG_TO_GROUP[group];

  if (!key) {
    // "weekend-treks" style filters
    const weekend = treks.filter((t) => t.tags?.some((tag) => ["beginner", "weekend", "half-day"].includes(tag)));
    if (group === "weekend-treks") {
      return (
        <>
          <PageHero title="Weekend Treks" crumb="Upcoming Treks / Weekend Treks" subtitle="Quick, beginner-friendly escapes for a perfect weekend." />
          <TrekGrid treks={weekend} eyebrow="Weekend" title="Weekend Friendly Treks" />
        </>
      );
    }
    return notFound();
  }

  const items = treks.filter((t) => t.group === key);
  return (
    <>
      <PageHero title={trekGroups[key].title} crumb={`Upcoming Treks / ${trekGroups[key].title}`} subtitle={trekGroups[key].blurb} />
      <TrekGrid treks={items} eyebrow={trekGroups[key].title} title={trekGroups[key].title} subtitle={trekGroups[key].blurb} />
    </>
  );
}
