import PageHero from "@/components/layout/PageHero";
import TrekGrid from "@/components/home/TrekGrid";
import { getListingTreks } from "@/lib/trekListing";

export const metadata = {
  title: "Backpacking Trips",
  description:
    "Coastal escapes, desert circuits, hill stations and Himalayan valleys — curated backpacking across India.",
};
export const dynamic = "force-dynamic";

export default async function BackpackingTripsPage() {
  const treks = await getListingTreks();
  const items = treks.filter((t) => t.group === "backpacking");
  return (
    <>
      <PageHero
        title="Backpacking Trips"
        crumb="Backpacking Trips"
        subtitle="Coastal escapes, desert circuits, hill stations and Himalayan valleys — curated backpacking across India."
      />
      <TrekGrid treks={items} eyebrow="Backpacking" title="Backpacking Trips Across India" />
    </>
  );
}
