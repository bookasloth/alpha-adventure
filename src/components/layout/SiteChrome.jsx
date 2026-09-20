"use client";
import { usePathname } from "next/navigation";

// Auth pages render full-screen (their own split-screen layout), so the site
// header/footer are hidden there. Everywhere else keeps the normal chrome.
const BARE = ["/login", "/signup", "/forgot-password", "/admin"];

export default function SiteChrome({ header, footer, children }) {
  const path = usePathname() || "";
  if (BARE.some((p) => path.startsWith(p))) return <>{children}</>;
  return (
    <>
      {header}
      <main>{children}</main>
      {footer}
    </>
  );
}
