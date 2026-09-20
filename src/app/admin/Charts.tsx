"use client";

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

const REVENUE = [
  { m: "Apr", revenue: 142000 }, { m: "May", revenue: 178000 }, { m: "Jun", revenue: 131000 },
  { m: "Jul", revenue: 205000 }, { m: "Aug", revenue: 243000 }, { m: "Sep", revenue: 285400 },
];
const STATUS_DATA = [
  { name: "Confirmed", value: 72 }, { name: "Pending", value: 18 },
  { name: "Completed", value: 24 }, { name: "Cancelled", value: 14 },
];
const TOP_TREKS = [
  { trek: "Harishchandragad", bookings: 42 }, { trek: "Kalsubai", bookings: 31 },
  { trek: "Spiti Valley", bookings: 19 }, { trek: "Seven Sisters", bookings: 14 }, { trek: "Rajgad", bookings: 9 },
];

export function RevenueArea() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={REVENUE} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="m" tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={46}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip cursor={{ stroke: BRAND, strokeWidth: 1, strokeDasharray: "3 3" }}
          content={({ active, payload, label }) => active && payload?.length
            ? <TipBox><div className="font-semibold text-ink">{label}</div><div className="text-gray-500">{inr(payload[0].value as number)}</div></TipBox> : null} />
        <Area type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2} fill="url(#rev)" activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut() {
  const total = STATUS_DATA.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={STATUS_DATA} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}
          label={({ value }) => `${Math.round((value / total) * 100)}%`} labelLine={false}
          stroke="#fff" strokeWidth={2} style={{ fontSize: 11, fontWeight: 600 }}>
          {STATUS_DATA.map((d) => <Cell key={d.name} fill={STATUS[d.name as keyof typeof STATUS]} />)}
        </Pie>
        <Legend verticalAlign="bottom" height={28} iconType="circle" iconSize={9}
          formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
        <Tooltip content={({ active, payload }) => active && payload?.length
          ? <TipBox><span className="font-medium text-ink">{payload[0].name}</span>: {payload[0].value} bookings</TipBox> : null} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TopTreksBar() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={TOP_TREKS} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
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
