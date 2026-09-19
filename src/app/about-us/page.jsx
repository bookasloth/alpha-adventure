import fs from "fs";
import path from "path";
import AboutScripts from "@/components/AboutScripts";

const aboutHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-about-us.html"),
  "utf8"
);
const aboutInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/about-us-init.js"),
  "utf8"
);

export const metadata = { title: "About Us" };

// Serves the original about-us page body verbatim.
export default function AboutPage() {
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: aboutHtml }}
      />
      <AboutScripts initCode={aboutInit} />
    </>
  );
}
