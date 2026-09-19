import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { gallery } from "@/data/gallery";

// Gallery section with a CTA overlay.
export default function Gallery() {
  return (
    <section className="section wow animate fadeInUp" data-wow-delay="200ms" data-wow-duration="1500ms">
      <div className="container-px">
        <SectionHeading
          eyebrow="Gallery"
          title="Alpha Adventure Gallery"
          subtitle="We go beyond just booking trips—we create unforgettable travel experiences that match your dreams!"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 auto-rows-[120px]">
          {gallery.map((g, i) => (
            <a
              key={i}
              href={g.full}
              target="_blank"
              rel="noreferrer"
              className={`group overflow-hidden rounded-xl2 ${i % 3 === 0 ? "row-span-2" : ""}`}
            >
              <img src={g.thumb} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </a>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/gallery" className="btn-primary">Book Your Trip</Link>
        </div>
      </div>
    </section>
  );
}
