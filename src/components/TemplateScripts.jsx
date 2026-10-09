"use client";

import { useEffect } from "react";

const TEMPLATE_JS = [
  "jquery-3.7.1.min.js",
  "jquery-ui.js",
  "moment.min.js",
  "daterangepicker.min.js",
  "bootstrap.min.js",
  "popper.min.js",
  "swiper-bundle.min.js",
  "slick.js",
  "waypoints.min.js",
  "jquery.counterup.min.js",
  "wow.min.js",
  "gsap.min.js",
  "ScrollTrigger.min.js",
  "jquery.fancybox.min.js",
  "select-dropdown.js",
  "custom.js?v=1786605967",
  "search-bar.js?v=1786605967",
];

export default function TemplateScripts() {
  useEffect(() => {
    if (window.__templateScriptsStarted) return;
    window.__templateScriptsStarted = true;

    // Insert all at once with async=false: the browser downloads them in
    // parallel but still executes them in list order (jQuery first). The old
    // onload chain paid one network round trip per file, 17 in a row.
    for (const f of TEMPLATE_JS) {
      const s = document.createElement("script");
      s.src = `/assets/js/${f}`;
      s.async = false;
      document.body.appendChild(s);
    }
  }, []);
  return null;
}