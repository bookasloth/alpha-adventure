import fs from "fs";
import path from "path";
import TrekDetailScripts from "@/components/TrekDetailScripts";

const bodyHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-trek-detail-seven-sisters.html"),
  "utf8"
);
const dataCode = fs.readFileSync(
  path.join(process.cwd(), "src/data/trek-detail-seven-sisters-data.js"),
  "utf8"
);
const slugCode = fs.readFileSync(
  path.join(process.cwd(), "src/data/trek-detail-seven-sisters-init.js"),
  "utf8"
);
const inlineCode = fs.readFileSync(
  path.join(process.cwd(), "src/data/trek-detail-seven-sisters-inline.js"),
  "utf8"
);
const css = fs.readFileSync(
  path.join(process.cwd(), "src/data/trek-detail-seven-sisters.css"),
  "utf8"
);

export const metadata = { title: "SEVEN SISTER'S HILL TREK" };

// Serves the live seven-sisters-hill-trek page body verbatim, hydrating the
// skeleton sections with the original trek-detail scripts.
export default function SevenSistersPage() {
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
