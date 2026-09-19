import fs from "fs";
import path from "path";

const footerHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-footer.html"),
  "utf8"
);

// Renders the original template footer verbatim.
export default function SiteFooter() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: footerHtml }}
    />
  );
}