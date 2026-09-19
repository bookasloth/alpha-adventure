import fs from "fs";
import path from "path";

const topbarHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-topbar.html"),
  "utf8"
);
const headerHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-header.html"),
  "utf8"
);

// Renders the original template shell (magic cursor, scroll-to-top, topbar, header) verbatim.
export default function SiteHeader() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: topbarHtml + headerHtml }}
    />
  );
}