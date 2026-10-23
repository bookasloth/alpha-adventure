"use client";

// Inner content of the "Deposit / split payment" card, shared by TrekEditForm and NewTrekForm.
// value: percent => whole number 1-100; flat => rupees (server converts to paise).
export type DepositState = { type: "none" | "percent" | "flat"; value: string; offset: string };
export const DEFAULT_DEPOSIT: DepositState = { type: "none", value: "", offset: "2" };

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

function Lbl({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}{hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}</span>
      {children}
    </label>
  );
}

// -> payload fields for create/updateTrek.
export const depositPayload = (d: DepositState) => ({
  deposit_type: d.type,
  deposit_value: d.type === "none" ? "0" : d.value || "0",
  balance_due_offset_days: d.offset || "2",
});

export default function DepositEditor({ value, onChange }: { value: DepositState; onChange: (v: DepositState) => void }) {
  const patch = (p: Partial<DepositState>) => onChange({ ...value, ...p });
  const pct = value.type === "percent";
  return (
    <div className="space-y-4">
      <p className="-mt-1 text-[11.5px] text-gray-400">
        Let buyers pay a deposit now and the balance later. &ldquo;None&rdquo; means pay in full at checkout.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Lbl label="Deposit type">
          <select className={inp} value={value.type} onChange={(e) => patch({ type: e.target.value as DepositState["type"] })}>
            <option value="none">None (full payment)</option>
            <option value="percent">Percentage</option>
            <option value="flat">Flat &#8377;</option>
          </select>
        </Lbl>
        {value.type !== "none" && (
          <Lbl label={pct ? "Deposit" : "Deposit amount"} hint={pct ? "· % of total (1-100)" : "· ₹ per booking"}>
            <input
              type="number" className={inp} value={value.value} placeholder={pct ? "30" : "5000"}
              min={pct ? 1 : 0} max={pct ? 100 : undefined} step={1}
              onChange={(e) => patch({ value: e.target.value })}
            />
          </Lbl>
        )}
        {value.type !== "none" && (
          <Lbl label="Balance due" hint="· days before departure (0-60)">
            <input type="number" min={0} max={60} step={1} className={inp} value={value.offset} onChange={(e) => patch({ offset: e.target.value })} />
          </Lbl>
        )}
      </div>
    </div>
  );
}
