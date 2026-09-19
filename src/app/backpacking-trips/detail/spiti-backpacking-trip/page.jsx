import fs from "fs";
import path from "path";
import TrekDetailScripts from "@/components/TrekDetailScripts";

const bodyHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-trek-detail-spiti.html"),
  "utf8"
);
const dataCode = fs.readFileSync(
  path.join(process.cwd(), "src/data/trek-detail-spiti-data.js"),
  "utf8"
);
const slugCode = fs.readFileSync(
  path.join(process.cwd(), "src/data/trek-detail-spiti-init.js"),
  "utf8"
);
const inlineCode = fs.readFileSync(
  path.join(process.cwd(), "src/data/trek-detail-spiti-inline.js"),
  "utf8"
);
const css = fs.readFileSync(
  path.join(process.cwd(), "src/data/trek-detail-spiti.css"),
  "utf8"
);

export const metadata = { title: "Spiti Backpacking Trip" };

// Serves the live spiti-backpacking-trip detail page body verbatim, hydrating
// the skeleton sections with the original trek-detail scripts.
export default function SpitiBackpackingTripPage() {
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      <TrekDetailScripts
        dataCode={dataCode}
        slugCode={slugCode}
        inlineCode={inlineCode}
        css={css}
      />
    </>
  );
}