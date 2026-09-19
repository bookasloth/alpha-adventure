import fs from "fs";
import path from "path";
import BeginnerTrekGuideScripts from "@/components/BeginnerTrekGuideScripts";

const guideHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-beginner-trek-guide.html"),
  "utf8"
);
const guideInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/beginner-trek-guide-init.js"),
  "utf8"
);

export const metadata = {
  title: "Beginner Trek Guide",
  description:
    "A comprehensive guide for first-time trekkers: what to expect, how to start, and tips.",
  keywords: "beginner, first time, tips, guide, introduction",
};

// Serves the original beginner-trek-guide page body verbatim.
export default function BeginnerTrekGuidePage() {
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: guideHtml }}
      />
      <BeginnerTrekGuideScripts initCode={guideInit} />
    </>
  );
}