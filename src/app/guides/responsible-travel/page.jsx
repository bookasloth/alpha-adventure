import fs from "fs";
import path from "path";
import ResponsibleTravelScripts from "@/components/ResponsibleTravelScripts";

const responsibleHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-responsible-travel.html"),
  "utf8"
);
const responsibleInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/responsible-travel-init.js"),
  "utf8"
);

export const metadata = {
  title: "Responsible Travel",
  description:
    "How GreyHawks practices sustainable tourism, leave-no-trace ethics, and supports local communities.",
  keywords: "sustainable, eco, green, responsible, local",
};

// Serves the original responsible-travel page body verbatim.
export default function ResponsibleTravelPage() {
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: responsibleHtml }}
      />
      <ResponsibleTravelScripts initCode={responsibleInit} />
    </>
  );
}