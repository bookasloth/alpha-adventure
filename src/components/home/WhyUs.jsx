import { reasons } from "@/data/reasons";
import SectionHeading from "@/components/ui/SectionHeading";

// "5 Reasons Why Alpha Adventures" — video cards alternating layout.
export default function WhyUs() {
  return (
    <section className="section bg-gray-50">
      <div className="container-px">
        <SectionHeading
          eyebrow="Why Choose Us"
          title="5 Reasons Why Alpha Adventures"
          subtitle="Discover why thousands of trekkers choose us to conquer the Sahyadri peaks and historical forts."
        />
        <div className="space-y-10">
          {reasons.map((r, i) => (
            <div
              key={r.no}
              className={`grid lg:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div className="overflow-hidden rounded-xl2 shadow-card">
                <a href={r.video} target="_blank" rel="noreferrer" className="relative block group">
                  <img src={r.image} alt={r.title} className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="h-16 w-16 rounded-full bg-white/90 grid place-items-center group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </a>
              </div>
              <div>
                <span className="text-5xl font-bold text-primary/20">Reason {r.no}</span>
                <h3 className="text-2xl font-bold text-ink mt-2">{r.title}</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
