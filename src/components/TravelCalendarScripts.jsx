"use client";

import { useEffect } from "react";

export default function TravelCalendarScripts({ initCode }) {
  useEffect(() => {
    const s = document.createElement("script");
    s.text = initCode;
    document.body.appendChild(s);
  }, [initCode]);
  return null;
}