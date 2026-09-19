import Link from "next/link";
import { img } from "@/lib/assets";

// Reusable inner-page header with breadcrumb + background image.
export default function PageHero({ title, crumb, subtitle, image = img("innerpages/breadcrumb-bg1.jpg") }) {
  return (
    <section className="relative bg-dark text-white">
      <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${image})` }} />
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="container-px relative pt-28 pb-16">
        <nav className="text-sm text-white/70 mb-3">
          <Link href="/" className="hover:text-white">Home</Link>
          {crumb && (
            <>
              <span className="mx-2">/</span>
              <span className="text-white">{crumb}</span>
            </>
          )}
        </nav>
        <h1 className="text-3xl sm:text-4xl font-bold">{title}</h1>
        {subtitle && <p className="mt-3 text-white/80 max-w-2xl">{subtitle}</p>}
      </div>
    </section>
  );
}
