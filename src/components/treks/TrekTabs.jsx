"use client";
import { useRef, useState } from "react";

// Horizontal tab bar + panel for the trek detail left column.
// `tabs` = [{ id, label, node }]; only tabs with content should be passed.
export default function TrekTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const wrapRef = useRef(null);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  // On tab click, keep the bar pinned at the top and start the panel right
  // below it (never hidden behind the sticky bar).
  const onSelect = (id) => {
    setActive(id);
    const wrap = wrapRef.current;
    if (!wrap) return;
    const top = wrap.getBoundingClientRect().top;
    if (top < 0) window.scrollBy({ top: top, behavior: "smooth" });
  };

  return (
    <div ref={wrapRef}>
      <div className="trek-tabbar -mx-1 mb-8 flex flex-wrap gap-2 px-1 pt-3">
        {tabs.map((t) => {
          const isActive = t.id === current.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="scroll-mt-[140px]">{current.node}</div>
    </div>
  );
}

