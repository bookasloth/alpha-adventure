import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { stories } from "@/data/stories";

// Trek stories (blog) section.
export default function TrekStories() {
  return (
    <section className="section wow animate fadeInUp" data-wow-delay="200ms" data-wow-duration="1500ms">
      <div className="container-px">
        <SectionHeading
          eyebrow="Stories"
          title="Trekking Stories from Maharashtra"
          subtitle="Real experiences, night treks and monsoon trails from the Sahyadris with Alpha Adventures."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {stories.map((s) => (
            <Link key={s.title} href={s.href} className="card group block hover:-translate-y-1 transition-transform">
              <div className="relative h-56 overflow-hidden">
                <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {s.date}
                </span>
              </div>
              <div className="p-5">
                <span className="text-xs text-primary font-medium">{s.location}</span>
                <h3 className="mt-2 font-bold text-ink leading-snug group-hover:text-primary transition-colors">
                  {s.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link href="/travel-inspiration-01" className="btn-dark">View All Trek Stories →</Link>
        </div>
      </div>
    </section>
  );
}
