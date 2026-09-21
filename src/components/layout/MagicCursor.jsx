"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// The legacy TemplateScripts (custom.js) drives the "magic" cursor — the
// mix-blend-mode ball that follows the pointer. It doesn't belong in the
// full-screen admin shell, so hide it on /admin. We hide (not unmount) because
// the legacy init references #magic-cursor and would error if absent.
export default function MagicCursor() {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const el = document.getElementById("magic-cursor");
    const apply = () => {
      document.body.classList.toggle("tt-magic-cursor", !isAdmin);
      if (el) el.style.display = isAdmin ? "none" : "";
    };
    apply();
    // custom.js initialises on load and may re-snapshot the element — re-assert.
    const t = setTimeout(apply, 2000);
    return () => clearTimeout(t);
  }, [isAdmin]);

  return (
    <div id="magic-cursor" style={isAdmin ? { display: "none" } : undefined}>
      <div id="ball"></div>
    </div>
  );
}