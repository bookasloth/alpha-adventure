"use client";

import { useEffect } from "react";

export default function ShopScripts({ initCode }) {
  useEffect(() => {
    const started = Date.now();
    const tryRun = () => {
      if (window.Swiper && window.bootstrap) {
        const s = document.createElement("script");
        s.text = initCode;
        document.body.appendChild(s);
        return true;
      }
      if (Date.now() - started < 10000) {
        setTimeout(tryRun, 100);
      }
      return false;
    };
    tryRun();
  }, [initCode]);
  return null;
}
