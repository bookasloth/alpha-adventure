import TrekCard from "@/components/ui/TrekCard";
import Link from "next/link";

// Renders a list of trek-group sections (title, blurb, grid, "explore all").
// `sections` = [{ key, title, blurb, items: [trek], href }]
export default function TrekGroupSections({ sections }) {
  return (
    <div className="space-y-16">
      {sections.map((s) => (
        <section key={s.key} className="container-px">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ink">{s.title}</h2>
            {s.blurb && <p className="mt-2 text-gray-600 max-w-2xl">{s.blurb}</p>}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {s.items.map((t) => (
              <TrekCard key={t.slug} trek={t} />
            ))}
          </div>
          {s.href && (
            <div className="mt-6">
              <Link href={s.href} className="text-primary font-semibold hover:underline">
                Explore all {s.title} →
              </Link>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
