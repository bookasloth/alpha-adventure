import fs from "fs";
import path from "path";

const homeHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-home.html"),
  "utf8"
);

// Serves the original home page body verbatim.
export default function HomePage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: homeHtml }}
    />
  );
}