import PageHero from "@/components/layout/PageHero";
import TrekGrid from "@/components/home/TrekGrid";
import { treks } from "@/data/treks";

export const metadata = { title: "Trips Near Nagpur" };

export default function TripsNearNagpurPage() {
  const items = treks
    .filter((t) => t.group === "near-nagpur")
    .map((t) => ({ ...t, href: `/trips-near-nagpur/detail/${t.slug}` }));
  return (
    <>
      <PageHero
        title="Trips Near Nagpur"
        crumb="Trips Near Nagpur"
        subtitle="Quick weekend getaways, hidden waterfalls and riverside camping — all close to Nagpur."
      />
      <TrekGrid treks={items} eyebrow="Near Nagpur" title="Weekend Escapes From Nagpur" />
    </>
  );
}
