"use client";
import { useState } from "react";

// Self-contained accordion — no Bootstrap. Smooth open/close via Tailwind
// grid-rows 0fr↔1fr (no JS height measuring, no lag).
export default function Accordion({ items }) {
  const [open, setOpen] = useState(0); // single-open; first expanded
  return (
    <div className="space-y-4">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="overflow-hidden rounded-xl2 border border-line/70">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors ${isOpen ? "bg-slate-50" : "bg-white"}`}
            >
              <span className="min-w-0">{it.title}</span>
              <svg className={`shrink-0 text-ink transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-gray-600">{it.body}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
