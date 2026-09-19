"use client";

import { useEffect } from "react";

// Serves the live trek-detail page's client-side hydration for the
// seven-sisters-hill-trek page: page-specific CSS, INITIAL_TREK_DATA,
// TREK_SLUG, and the helper/custom-calendar/trek-detail scripts, then the
// original inline init handlers (package read-more, about read-more,
// itinerary toggle, brochure modal, location lightbox) after hydration.
//
// Every injection is idempotent: dev-mode StrictMode runs this effect twice
// and HMR can re-run it, so a second run must not append duplicate scripts
// (top-level class/const declarations would throw "already declared").
export default function TrekDetailScripts({ dataCode, slugCode, inlineCode, css }) {
  useEffect(() => {
    if (!document.querySelector("#td-page-style")) {
      const style = document.createElement("style");
      style.id = "td-page-style";
      style.textContent = css;
      document.head.appendChild(style);
    }

    if (typeof window.INITIAL_TREK_DATA === "undefined") {
      const setData = document.createElement("script");
      setData.text = dataCode;
      document.body.appendChild(setData);
    }

    if (typeof window.TREK_SLUG === "undefined") {
      const setSlug = document.createElement("script");
      setSlug.text = slugCode;
      document.body.appendChild(setSlug);
    }

    if (window.__tdBootStarted) return;
    window.__tdBootStarted = true;

    const started = Date.now();
    const tryRun = () => {
      if (window.jQuery && window.Swiper && window.bootstrap) {
        let i = 0;
        const files = ["helper.js", "custom-calendar.js", "trek-detail.js"];
        const load = () => {
          if (i >= files.length) {
            boot();
            return;
          }
          const src = `/assets/js/${files[i++]}`;
          const s = document.createElement("script");
          s.src = src;
          s.async = false;
          s.onload = load;
          s.onerror = load;
          document.body.appendChild(s);
        };
        load();
        return true;
      }
      if (Date.now() - started < 12000) {
        setTimeout(tryRun, 100);
      }
      return false;
    };
    tryRun();

    function boot() {
      // trek-detail.js hooks its init to DOMContentLoaded, which has already
      // fired by the time React hydrates. Replicate its DOMContentLoaded block
      // (manager creation + gallery lightbox), then run the original inline
      // init handlers against the hydrated DOM. TrekDetailManager is a global
      // class declaration (not on window), so check the bare binding.
      if (typeof TrekDetailManager !== "undefined" && !window.trekManager) {
        try {
          window.trekManager = new TrekDetailManager(window.TREK_SLUG);
        } catch (e) {
          console.error("Failed to init trek detail", e);
        }
      }
      if (typeof initGalleryLightbox === "function") {
        try {
          globalThis.initGalleryLightbox();
        } catch (e) {
          console.error("Failed to init gallery lightbox", e);
        }
      }
      if (!document.querySelector("#td-inline-init")) {
        const inline = document.createElement("script");
        inline.id = "td-inline-init";
        inline.text = inlineCode;
        document.body.appendChild(inline);
      }
    }
  }, [dataCode, slugCode, inlineCode, css]);
  return null;
}