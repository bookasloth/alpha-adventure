import Link from "next/link";
import { img } from "@/lib/assets";

// Reusable inner-page header: full-bleed image with a neutral dark scrim for
// legibility (no brand-orange tint), breadcrumb + heading + subtext centered.
export default function PageHero({ title, crumb, subtitle, image = img("innerpages/breadcrumb-bg1.jpg") }) {
  return (
    <section className="relative bg-dark text-white">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
      {/* neutral scrim — keeps text readable without the orange wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/45 to-black/65" />
      <div className="container-px relative pt-32 pb-20 text-center">
        <nav className="text-sm text-white mb-4 flex items-center justify-center gap-2">
          <Link href="/" className="text-white hover:text-white/80">Home</Link>
          {crumb && (
            <>
              <span className="text-white">/</span>
              <span className="text-white">{crumb}</span>
            </>
          )}
        </nav>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">{title}</h1>
        {subtitle && <p className="mt-4 text-white/85 max-w-2xl mx-auto">{subtitle}</p>}
      </div>
    </section>
  );
}
