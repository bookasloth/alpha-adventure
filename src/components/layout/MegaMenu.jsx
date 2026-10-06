"use client";

import { useEffect } from "react";

// Desktop behaviour for the header mega-menu injected (static) by SiteHeader.
// The markup + CSS assume a controller that was never written: each category
// link carries a data-target id and every .mega-sub-panel is display:none
// except the .active one, so without this the category tabs are dead and only
// the first group ever shows. On mobile the panel is hidden entirely (CSS) and
// the section links navigate straight to their landing pages, so there's
// nothing to wire there.
export default function MegaMenu() {
  useEffect(() => {
    const panels = Array.from(document.querySelectorAll(".aa-mega-panel"));
    if (!panels.length) return;
    const isMobile = () => window.matchMedia("(max-width: 991px)").matches;
    const cleanups = [];

    for (const panel of panels) {
      const catLinks = Array.from(panel.querySelectorAll(".mega-cat-link"));
      const subPanels = Array.from(panel.querySelectorAll(".mega-sub-panel"));

      // Reveal the destination group a category points at.
      const activate = (link) => {
        const id = link.getAttribute("data-target");
        if (!id) return;
        catLinks.forEach((l) => l.classList.toggle("active", l === link));
        subPanels.forEach((p) => p.classList.toggle("active", p.id === id));
      };

      for (const link of catLinks) {
        const onEnter = () => { if (!isMobile()) activate(link); };
        link.addEventListener("mouseenter", onEnter);
        link.addEventListener("focusin", onEnter);
        cleanups.push(() => {
          link.removeEventListener("mouseenter", onEnter);
          link.removeEventListener("focusin", onEnter);
        });
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
