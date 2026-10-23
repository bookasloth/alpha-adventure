"use client";

import { Plus, Trash2 } from "lucide-react";
import { MAX_BOARDING } from "./boarding";

// Inner content of the "Boarding locations" card, shared by TrekEditForm and NewTrekForm
// (each wraps it in its own SectionCard). Rows: name / subtext / price (₹ per traveller).
export type BoardingRow = { id?: string; name: string; subtext: string; price: string };

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

function Lbl({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}{hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}</span>
      {children}
    </label>
  );
}

// Row -> server payload (drops blank-name rows; the server also re-validates + caps).
export const boardingPayload = (rows: BoardingRow[]) =>
  rows.filter((r) => r.name.trim()).slice(0, MAX_BOARDING).map((r) => ({
    id: r.id, name: r.name.trim(), subtext: r.subtext.trim(), price: r.price || "0",
  }));

export default function BoardingEditor({ rows, setRows, disclaimer, setDisclaimer }: {
  rows: BoardingRow[]; setRows: (v: BoardingRow[]) => void;
  disclaimer: string; setDisclaimer: (v: string) => void;
}) {
  const patch = (i: number, k: keyof BoardingRow, v: string) => setRows(rows.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="space-y-4">
      <p className="-mt-1 text-[11.5px] text-gray-400">
        Pickup points shown at checkout. The price is charged <span className="font-semibold">per traveller</span> (adults + children); ₹0 = free. Up to {MAX_BOARDING}.
      </p>
      {rows.map((r, i) => (
        <div key={r.id ?? i} className="rounded-xl border border-line bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-ink">Location {i + 1}</span>
            <button type="button" aria-label={`Remove location ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-gray-400 transition hover:text-red-600"><Trash2 size={15} /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Lbl label="Name"><input className={inp} value={r.name} maxLength={120} onChange={(e) => patch(i, "name", e.target.value)} placeholder="Nagpur" /></Lbl>
            <Lbl label="Subtext" hint="· optional"><input className={inp} value={r.subtext} maxLength={200} onChange={(e) => patch(i, "subtext", e.target.value)} placeholder="Railway station, 9:30 PM" /></Lbl>
            <Lbl label="Price" hint="· ₹ / traveller"><input type="number" min={0} className={inp} value={r.price} onChange={(e) => patch(i, "price", e.target.value)} placeholder="0" /></Lbl>
          </div>
        </div>
      ))}
      {rows.length < MAX_BOARDING && (
        <button type="button" onClick={() => setRows([...rows, { name: "", subtext: "", price: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"><Plus size={15} /> Add boarding location</button>
      )}
      <Lbl label="Boarding disclaimer" hint="· optional, shown under the picker">
        <textarea className={`${inp} min-h-20`} maxLength={1000} value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} placeholder="Reporting time is 30 minutes before departure. The bus will not wait for late arrivals." />
      </Lbl>
    </div>
  );
}
