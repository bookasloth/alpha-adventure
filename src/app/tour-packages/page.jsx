import PageHero from "@/components/layout/PageHero";
import TourPackages from "@/components/home/TourPackages";
import { getTours } from "@/lib/tourListing";
import { img } from "@/lib/assets";

export const metadata = { title: "Tour Packages" };
export const revalidate = 300;

export default async function TourPackagesPage() {
  const tours = await getTours();
  return (
    <>
      <PageHero
        title="Tour Packages"
        crumb="Tour Packages"
        subtitle="Explore our most popular domestic and international tour packages, planned end-to-end."
        image={img("home1/tour-package-img1.jpg")}
      />
      <TourPackages tours={tours} />
    </>
  );
}
