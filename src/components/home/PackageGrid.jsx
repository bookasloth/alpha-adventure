import PackageCard from "@/components/ui/PackageCard";
import SectionHeading from "@/components/ui/SectionHeading";

// Grid of homepage-style .package-card cards. Uses the legacy bootstrap grid so
// the cards sit in the same context their style.css rules expect.
export default function PackageGrid({ eyebrow, title, subtitle, treks }) {
  return (
    <section className="section">
      <div className="container-px">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        {treks.length === 0 ? (
          <p className="text-center text-gray-500 py-10">Nothing here yet — check back soon.</p>
        ) : (
          <div className="row g-4">
            {treks.map((t) => (
              <div key={t.slug} className="col-xl-3 col-lg-4 col-md-6">
                <PackageCard trek={t} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
