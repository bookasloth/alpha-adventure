import Link from "next/link";
import TrekCard from "@/components/ui/TrekCard";

// Collection listing (geo / difficulty) — a hero band + a grid of trek cards.
export default function TrekCollection({ label, subtitle, treks }) {
  return (
    <>
      <section className="relative bg-dark text-white">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="container-px relative py-16 sm:py-20">
          <nav className="mb-3 text-sm text-white/70">
            <Link href="/" className="hover:text-white">Home</Link><span className="mx-2">›</span>
            <Link href="/treks/upcoming-treks" className="hover:text-white">Treks</Link><span className="mx-2">›</span>
            <span className="text-white">{label}</span>
          </nav>
          <h1 className="text-3xl font-bold sm:text-4xl">{label}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-white/80">{subtitle}</p>}
        </div>
      </section>

      <section className="section">
        <div className="container-px">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {treks.map((t) => <TrekCard key={t.slug} trek={t} />)}
          </div>
        </div>
      </section>
    </>
  );
}
