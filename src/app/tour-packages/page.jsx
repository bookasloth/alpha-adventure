import PageHero from "@/components/layout/PageHero";
import TourPackages from "@/components/home/TourPackages";
import { tourPackages } from "@/data/tours";
import { img } from "@/lib/assets";

export const metadata = { title: "Tour Packages" };

export default function TourPackagesPage() {
  return (
    <>
      <PageHero
        title="Tour Packages"
        crumb="Tour Packages"
        subtitle="Explore our most popular domestic and international tour packages, planned end-to-end."
        image={img("home1/tour-package-img1.jpg")}
      />
      <TourPackages />
    </>
  );
}
