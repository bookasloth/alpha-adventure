import fs from "fs";
import path from "path";
import PackingChecklistScripts from "@/components/PackingChecklistScripts";

const packingHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-packing-checklist.html"),
  "utf8"
);
const packingInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/packing-checklist-init.js"),
  "utf8"
);

export const metadata = {
  title: "Packing Checklist",
  description:
    "The ultimate packing list for single-day Sahyadri treks, multi-day Himalayan expeditions, and camping.",
  keywords: "packing, list, checklist, luggage, clothes, gear",
};

// Serves the original packing-checklist page body verbatim.
export default function PackingChecklistPage() {
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: packingHtml }}
      />
      <PackingChecklistScripts initCode={packingInit} />
    </>
  );
}