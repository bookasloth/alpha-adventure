"use client";
import { useEffect, useRef, useState } from "react";

// In-page section navigation for the trek detail page. Every trek section
// (Overview, About, Itinerary, …) renders stacked on one page; this bar stays
// pinned while scrolling, highlights the section in view, and scrolls to a
// section on click.
export default function TrekSectionNav({ sections, trailing }) {
  const navRef = useRef(null);
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const onScroll = () => {
      const navH = navRef.current?.offsetHeight ?? 0;
      let current = sections[0]?.id;
      for (const s of sections) {
        const el = document.getElementById(`section-${s.id}`);
        if (el && el.getBoundingClientRect().top - navH - 24 <= 0) current = s.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  const goTo = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    const navH = navRef.current?.offsetHeight ?? 0;
    const top = el.getBoundingClientRect().top + window.scrollY - navH - 12;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav ref={navRef} className="trek-section-nav" aria-label="Trek sections">
      <div className="flex flex-wrap items-center gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(s.id)}
            aria-current={active === s.id ? "true" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              active === s.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
        {trailing && <div className="ml-auto">{trailing}</div>}
      </div>
    </nav>
  );
}
