import PageHero from "@/components/layout/PageHero";
import PackageGrid from "@/components/home/PackageGrid";
import { getListingTreks } from "@/lib/trekListing";

export const metadata = { title: "Trips Near Nagpur" };
export const revalidate = 300;

export default async function TripsNearNagpurPage() {
  const treks = await getListingTreks();
  const items = treks.filter((t) => t.group === "near-nagpur");
  return (
    <>
      <PageHero
        title="Trips Near Nagpur"
        crumb="Trips Near Nagpur"
        subtitle="Quick weekend getaways, hidden waterfalls and riverside camping — all close to Nagpur."
      />
      <PackageGrid treks={items} eyebrow="Near Nagpur" title="Weekend Escapes From Nagpur" />
    </>
  );
}
