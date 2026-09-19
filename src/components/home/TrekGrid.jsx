import TrekCard from "@/components/ui/TrekCard";
import SectionHeading from "@/components/ui/SectionHeading";
import Link from "next/link";

// Reusable grid of trek cards with a heading and optional "view all" link.
export default function TrekGrid({ eyebrow, title, subtitle, treks, viewAllHref, viewAllLabel }) {
  return (
    <section className="section wow animate fadeInUp" data-wow-delay="200ms" data-wow-duration="1500ms">
      <div className="container-px">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {treks.map((t) => (
            <TrekCard key={t.slug} trek={t} />
          ))}
        </div>
        {viewAllHref && (
          <div className="text-center mt-10">
            <Link href={viewAllHref} className="btn-dark">
              {viewAllLabel || "View All Trips"} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
