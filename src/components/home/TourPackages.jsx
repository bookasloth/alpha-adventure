import TourCard from "@/components/ui/TourCard";
import SectionHeading from "@/components/ui/SectionHeading";

// Tour packages section. `tours` are passed in (from Supabase).
export default function TourPackages({ tours = [] }) {
  return (
    <section className="section bg-gray-50 wow animate fadeInUp" data-wow-delay="200ms" data-wow-duration="1500ms">
      <div className="container-px">
        <SectionHeading
          eyebrow="Tour Packages"
          title="Explore Our Most Popular Tours"
          subtitle="Domestic and international tour packages, planned end-to-end."
        />
        <div className="row g-4">
          {tours.map((t) => (
            <div key={t.slug} className="col-xl-4 col-lg-4 col-md-6">
              <TourCard tour={t} />
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <a href="/tour-packages" className="primary-btn1 transparent"><span>View All Trips</span><span>View All Trips</span></a>
        </div>
      </div>
    </section>
  );
}
