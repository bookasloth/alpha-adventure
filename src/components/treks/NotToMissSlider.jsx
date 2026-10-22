"use client";

import { useRef, useState } from "react";

// Single card colour theme — applied as inline styles (not utility classes) so
// the legacy global stylesheet / Bootstrap defaults can't override the border
// and background colours.
const CARD_THEME = { border: "#f7c6ac", bg: "#fff4ee", iconBg: "#ffe0d2", icon: "#fe5100" };

// Horizontal card slider for the trek "Not to Miss" items. Plain overflow
// scroll-snap so it needs no Swiper instance; arrows scroll by one card.
export default function NotToMissSlider({ items = [] }) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  };

  const scrollByCard = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    const step = card ? card.getBoundingClientRect().width + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={atStart}
            aria-label="Previous"
            className="grid h-9 w-9 place-items-center rounded-full border border-line/70 text-ink transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <i className="bi bi-chevron-left" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={atEnd}
            aria-label="Next"
            className="grid h-9 w-9 place-items-center rounded-full border border-line/70 text-ink transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <i className="bi bi-chevron-right" />
          </button>
      </div>

      <div
        ref={trackRef}
        onScroll={updateEdges}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 scroll-px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div
            key={i}
            data-card
            className="flex w-[280px] shrink-0 snap-start flex-col gap-3 rounded-xl2 p-4 text-[15px] leading-relaxed text-gray-700"
            style={{ backgroundColor: CARD_THEME.bg, border: `1px solid ${CARD_THEME.border}` }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl2 text-lg"
              style={{ backgroundColor: CARD_THEME.iconBg, color: CARD_THEME.icon }}
            >
              <i className="bi bi-lightbulb-fill" />
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
