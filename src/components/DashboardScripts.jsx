"use client";

import { useEffect } from "react";

export default function DashboardScripts({ initCode }) {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/css/dashboard.css";
    document.head.appendChild(link);

    const started = Date.now();
    const tryRun = () => {
      if (window.jQuery) {
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