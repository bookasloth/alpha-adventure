"use client";

import { useEffect } from "react";

export default function GalleryDetailScripts({ initCode }) {
  useEffect(() => {
    const s = document.createElement("script");
    s.text = initCode;
    document.body.appendChild(s);
  }, [initCode]);
  return null;
}