import SectionHeading from "@/components/ui/SectionHeading";
import { stats } from "@/data/gallery";

// Stats counters.
export default function Stats() {
  return (
    <section className="bg-primary text-white">
      <div className="container-px py-12 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-4xl font-bold">
              {s.value}
              <span className="text-2xl">{s.suffix}</span>
            </p>
            <p className="mt-1 text-sm text-white/80">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
