import fs from "fs";
import path from "path";
import DashboardScripts from "@/components/DashboardScripts";

const dashHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-dashboard.html"),
  "utf8"
);
const dashInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/dashboard-init.js"),
  "utf8"
);

export const metadata = { title: "User Dashboard" };

// Serves the original user-dashboard page body verbatim.
export default function DashboardPage() {
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: dashHtml }}
      />
      <DashboardScripts initCode={dashInit} />
    </>
  );
}