import PageHero from "@/components/layout/PageHero";
import TourCard from "@/components/ui/TourCard";
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
        fullHeight
      />
      <section className="section">
        <div className="container-px">
          <div className="row g-4">
            {tours.map((t) => (
              <div key={t.slug} className="col-xl-4 col-lg-4 col-md-6">
                <TourCard tour={t} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
