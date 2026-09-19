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

    let i = 0;
    const load = () => {
      if (i >= TEMPLATE_JS.length) return;
      const src = `/assets/js/${TEMPLATE_JS[i++]}`;
      const s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = load;
      s.onerror = load;
      document.body.appendChild(s);
    };
    load();
  }, []);
  return null;
}