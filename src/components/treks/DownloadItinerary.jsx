"use client";

// Small sidebar button: downloads the official brochure when one is uploaded
// (`brochure_url`), otherwise generates a plain-text itinerary from the day
// rows so the button always does something useful.
export default function DownloadItinerary({ trek, itinerary }) {
  const hasDays = Array.isArray(itinerary) && itinerary.length > 0;

  const generate = () => {
    const lines = [
      trek.title,
      "=".repeat(trek.title.length),
      trek.summary || "",
      "",
      `Duration: ${trek.duration_days ? `${trek.duration_days} Day(s)` : "—"}`,
      trek.difficulty ? `Difficulty: ${trek.difficulty}` : "",
      trek.altitude ? `Highest Altitude: ${trek.altitude}` : "",
      trek.base_camp ? `Base Camp: ${trek.base_camp}` : "",
      "",
      "ITINERARY",
      "--------",
    ].filter(Boolean);

    for (const d of itinerary) {
      lines.push("", `Day ${d.day_no}: ${d.title}`);
      const metrics = [
        d.trek_distance && `Trek Distance: ${d.trek_distance}`,
        d.trek_duration && `Trek Duration: ${d.trek_duration}`,
        d.drive_distance && `Drive Distance: ${d.drive_distance}`,
        d.drive_duration && `Drive Duration: ${d.drive_duration}`,
        d.altitude_gain && `Altitude Gain: ${d.altitude_gain}`,
        d.altitude_loss && `Altitude Loss: ${d.altitude_loss}`,
        d.meals && `Meals: ${d.meals}`,
      ].filter(Boolean);
      for (const m of metrics) lines.push(`  ${m}`);
      if (d.description) lines.push("", `  ${d.description}`);
    }

    lines.push("", "— Alpha Adventures | alphaadventures.in");

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${trek.slug}-itinerary.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onClick = () => {
    if (trek.brochure_url) return; // native download via the anchor
    generate();
  };

  const cls =
    "inline-flex items-center justify-center gap-1.5 rounded-full border border-line/70 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-primary hover:text-primary";

  if (trek.brochure_url) {
    return (
      <a href={trek.brochure_url} download className={cls}>
        <i className="bi bi-download" /> Download Brochure
      </a>
    );
  }
  if (!hasDays) return null;
  return (
    <button type="button" onClick={onClick} className={cls}>
      <i className="bi bi-download" /> Download Itinerary
    </button>
  );
}
