import fs from "fs";
import path from "path";
import TravelCalendarScripts from "@/components/TravelCalendarScripts";

const calendarHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-travel-calendar.html"),
  "utf8"
);
const calendarInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/travel-calendar-init.js"),
  "utf8"
);

export const metadata = { title: "Travel Calendar" };

// Serves the original travel-calendar page body verbatim.
export default function TravelCalendarPage() {
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: calendarHtml }}
      />
      <TravelCalendarScripts initCode={calendarInit} />
    </>
  );
}