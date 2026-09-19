import SectionHeading from "@/components/ui/SectionHeading";
import { testimonials } from "@/data/testimonials";

function Stars({ n }) {
  return (
    <div className="flex gap-0.5 text-accent">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i}>{i <= n ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

// Testimonials section.
export default function Testimonials() {
  return (
    <section className="section bg-gray-50 wow animate fadeInUp" data-wow-delay="200ms" data-wow-duration="1500ms">
      <div className="container-px">
        <SectionHeading
          eyebrow="Reviews"
          title="What Trekkers Say About Us"
          subtitle="From first enquiry to final descend, our team handles planning, support and safety so you can focus on the climb."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="card p-6">
              <Stars n={t.rating} />
              <h4 className="mt-3 font-bold text-ink">{t.title || "Happy Trekker"}</h4>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{t.text}</p>
              <div className="mt-4 flex items-center gap-3">
                <img src={t.image} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
