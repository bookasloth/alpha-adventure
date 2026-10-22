"use client";

import Link from "next/link";
import { img } from "@/lib/assets";
import { useEffect, useState } from "react";

// Reusable inner-page header: full-bleed image with a neutral dark scrim for
// legibility (no brand-orange tint), breadcrumb + heading + subtext centered.
export default function PageHero({ title, crumb, subtitle, image = img("innerpages/breadcrumb-bg1.jpg"), fullHeight = false }) {
  const [minHeight, setMinHeight] = useState(null);

  useEffect(() => {
    if (!fullHeight) return;
    const update = () => {
      const topbar = document.querySelector(".topbar-area");
      const header = document.querySelector("header.style-1");
      const topbarH = topbar && getComputedStyle(topbar).display !== "none" ? topbar.offsetHeight : 0;
      const headerH = header ? header.offsetHeight : 0;
      setMinHeight(Math.max(window.innerHeight - topbarH - headerH, 320));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [fullHeight]);

  return (
    <section
      className={`relative bg-dark text-white ${
        fullHeight
          ? `flex items-center ${minHeight == null ? "min-h-[calc(100svh-5rem)] lg:min-h-[calc(100svh-9.5rem)]" : ""}`
          : ""
      }`}
      style={fullHeight && minHeight != null ? { minHeight } : undefined}
    >
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
      {/* neutral scrim — keeps text readable without the orange wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/45 to-black/65" />
      <div className={`container-px relative text-center ${fullHeight ? "w-full py-16" : "pt-32 pb-20"}`}>
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
