"use client";

import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";

const BRAND = "#fe5100";
const AXIS = "#9ca3af";
const GRID = "#eef0f3";
// Status palette (validated; discharged via legend + direct labels).
const STATUS = { Confirmed: "#16a34a", Pending: "#f59e0b", Completed: "#2563eb", Cancelled: "#dc2626" } as const;

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function TipBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-soft">{children}</div>;
}

const RANGES = [
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "6m", label: "Last 6 Months" },
  { key: "12m", label: "This Year" },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

const daySeries = (n: number, base: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(2026, 8, 21 - (n - 1 - i)); // anchored at 21 Sep 2026
    const label = `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
    const progress = i / Math.max(n - 1, 1);
    return { m: label, revenue: Math.round(base * (0.72 + progress * 0.55 + Math.sin(i * 1.15 + 1) * 0.14)) };
  });

const monthSeries = (labels: string[], base: number) =>
  labels.map((m, i) => ({ m, revenue: Math.round(base * (0.7 + (i / labels.length) * 0.6 + Math.sin(i * 1.3 + 1) * 0.15)) }));

const MONTHS_12 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const RANGE_DATA: Record<RangeKey, { m: string; revenue: number }[]> = {
  "7d": daySeries(7, 22000),
  "30d": daySeries(30, 9000),
  "6m": monthSeries(["Apr", "May", "Jun", "Jul", "Aug", "Sep"], 220000),
  "12m": monthSeries(MONTHS_12, 200000),
};

export function RevenueArea({ sixMonth }: { sixMonth?: { m: string; revenue: number }[] }) {
  const [range, setRange] = useState<RangeKey>("6m");
  // Real 6-month series when provided; other ranges stay illustrative (no
  // daily/12-month aggregation wired yet).
  const data = range === "6m" && sixMonth?.length ? sixMonth : RANGE_DATA[range];
  return (
    <div className="space-y-4">
      <div className="flex w-fit flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
        {RANGES.map((r) => (
          <button key={r.key} onClick={() => setRange(r.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${range === r.key ? "bg-primary text-white" : "text-gray-500 hover:text-ink"}`}>
            {r.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="m" tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={46}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip cursor={{ stroke: BRAND, strokeWidth: 1, strokeDasharray: "3 3" }}
            content={({ active, payload, label }) => active && payload?.length
              ? <TipBox><div className="font-semibold text-ink">{label}</div><div className="text-gray-500">{inr(payload[0].value as number)}</div></TipBox> : null} />
          <Area type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2} fill="url(#rev)" activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const TOP_TREKS = [
  { trek: "Harishchandragad", bookings: 42 }, { trek: "Kalsubai", bookings: 31 },
  { trek: "Spiti Valley", bookings: 19 }, { trek: "Seven Sisters", bookings: 14 }, { trek: "Rajgad", bookings: 9 },
];

const STATUS_DATA = [
  { name: "Confirmed", value: 72 }, { name: "Pending", value: 18 },
  { name: "Completed", value: 24 }, { name: "Cancelled", value: 14 },
];

export function StatusDonut({ data = STATUS_DATA }: { data?: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}
          label={({ value }) => `${Math.round(((value as number) / total) * 100)}%`} labelLine={false}
          stroke="#fff" strokeWidth={2} style={{ fontSize: 11, fontWeight: 600 }}>
          {data.map((d) => <Cell key={d.name} fill={STATUS[d.name as keyof typeof STATUS]} />)}
        </Pie>
        <Legend verticalAlign="bottom" height={28} iconType="circle" iconSize={9}
          formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
        <Tooltip content={({ active, payload }) => active && payload?.length
          ? <TipBox><span className="font-medium text-ink">{payload[0].name}</span>: {payload[0].value} bookings</TipBox> : null} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TopTreksBar({ data = TOP_TREKS }: { data?: { trek: string; bookings: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data.length ? data : TOP_TREKS} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="trek" width={98} tick={{ fill: "#374151", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(254,81,0,.06)" }}
          content={({ active, payload, label }) => active && payload?.length
            ? <TipBox><span className="font-medium text-ink">{label}</span>: {payload[0].value} bookings</TipBox> : null} />
        <Bar dataKey="bookings" fill={BRAND} radius={[0, 4, 4, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
