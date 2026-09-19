import TourCard from "@/components/ui/TourCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { tourPackages } from "@/data/tours";

// Tour packages section.
export default function TourPackages() {
  return (
    <section className="section bg-gray-50 wow animate fadeInUp" data-wow-delay="200ms" data-wow-duration="1500ms">
      <div className="container-px">
        <SectionHeading
          eyebrow="Tour Packages"
          title="Explore Our Most Popular Tours"
          subtitle="Domestic and international tour packages, planned end-to-end."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tourPackages.map((t) => (
            <TourCard key={t.slug} tour={t} />
          ))}
        </div>
        <div className="text-center mt-10">
          <a href="/tour-packages" className="btn-dark">View All Trips →</a>
        </div>
      </div>
    </section>
  );
}
