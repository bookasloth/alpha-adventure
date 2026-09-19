import fs from "fs";
import path from "path";

const corporateHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-corporate-programmes.html"),
  "utf8"
);

export const metadata = {
  title: "Corporate Programmes",
  description:
    "Team building events, leadership camps, and custom retreats designed for corporate teams.",
  keywords: "corporate, team building, company, retreat, event",
};

// Serves the corporate-programmes page body verbatim.
export default function CorporateProgrammesPage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: corporateHtml }}
    />
  );
}