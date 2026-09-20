"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Ticket, CreditCard, User, LogOut, Mountain,
  CalendarCheck, Wallet, ChevronRight,
} from "lucide-react";
import { signOut } from "../login/actions";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const rupees = (p?: number | null) => `₹${((p ?? 0) / 100).toLocaleString("en-IN")}`;
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const STATUS: Record<string, { label: string; variant: "neutral" | "success" | "warning" | "danger" | "brand" }> = {
  draft: { label: "Draft", variant: "neutral" },
  pending_auth: { label: "Awaiting verification", variant: "warning" },
  pending_payment: { label: "Awaiting payment", variant: "warning" },
  payment_processing: { label: "Processing", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  deposit_paid: { label: "Deposit paid", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  payment_failed: { label: "Payment failed", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "danger" },
  expired: { label: "Expired", variant: "neutral" },
};
const StatusBadge = ({ s }: { s: string }) => {
  const m = STATUS[s] ?? { label: s, variant: "neutral" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

// 2-level rail: grouped sections (group label = level 1, items = level 2).
const NAV = [
  { group: "Account", items: [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "bookings", label: "My Bookings", icon: Ticket },
    { key: "payments", label: "Payments", icon: CreditCard },
  ] },
  { group: "Settings", items: [
    { key: "profile", label: "Profile", icon: User },
  ] },
];

type Booking = { id: string; reference: string; trek_title: string | null; departure_date: string | null; status: string; adults: number | null; children: number | null; grand_total: number | null; created_at: string };
type Props = {
  email?: string;
  profile: Record<string, any>;
  bookings: Booking[];
  payments: { id: string; date: string; reference: string; amount: number | null; status: string }[];
  stats: { total: number; upcoming: number; spent: number };
};

export default function Dashboard({ email, profile, bookings, payments, stats }: Props) {
  const [tab, setTab] = useState("overview");
  const initials = (profile.full_name || email || "U").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-[70vh] bg-page">
      <div className="container-px flex gap-6 py-8">
        {/* ── SIDEBAR (2-level rail) ───────────────────────────── */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl2 border border-line/70 bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center gap-3 border-b border-line/70 pb-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">{initials}</div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink">{profile.full_name || "Trekker"}</div>
                <div className="truncate text-xs text-gray-500">{email}</div>
              </div>
            </div>
            <nav className="space-y-5">
              {NAV.map((g) => (
                <div key={g.group}>
                  <div className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">{g.group}</div>
                  <div className="space-y-0.5">
                    {g.items.map((it) => {
                      const Icon = it.icon;
                      const active = tab === it.key;
                      return (
                        <button key={it.key} onClick={() => setTab(it.key)}
                          className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            active ? "bg-primary text-white" : "text-gray-600 hover:bg-slate-100")}>
                          <Icon size={18} /> {it.label}
                          {active && <ChevronRight size={16} className="ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="border-t border-line/70 pt-3">
                <form action={signOut}>
                  <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600">
                    <LogOut size={18} /> Sign out
                  </button>
                </form>
              </div>
            </nav>
          </div>
        </aside>

        {/* ── MAIN ─────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1">
          {/* mobile tab bar */}
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {NAV.flatMap((g) => g.items).map((it) => (
              <button key={it.key} onClick={() => setTab(it.key)}
                className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", tab === it.key ? "bg-primary text-white" : "bg-white text-gray-600 border border-line")}>
                {it.label}
              </button>
            ))}
          </div>

          {tab === "overview" && <Overview stats={stats} bookings={bookings} onSeeAll={() => setTab("bookings")} />}
          {tab === "bookings" && <Bookings bookings={bookings} />}
          {tab === "payments" && <Payments payments={payments} />}
          {tab === "profile" && <Profile email={email} profile={profile} />}
        </main>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid h-12 w-12 place-items-center rounded-xl2 bg-primary/10 text-primary"><Icon size={22} /></div>
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-2xl font-bold text-ink">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Overview({ stats, bookings, onSeeAll }: { stats: Props["stats"]; bookings: Booking[]; onSeeAll: () => void }) {
  const recent = bookings.slice(0, 5);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Welcome back 👋</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Ticket} label="Total bookings" value={String(stats.total)} />
        <Stat icon={CalendarCheck} label="Upcoming treks" value={String(stats.upcoming)} />
        <Stat icon={Wallet} label="Total spent" value={rupees(stats.spent)} />
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent bookings</CardTitle>
          {bookings.length > 0 && <Button variant="ghost" size="sm" onClick={onSeeAll}>See all</Button>}
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? <Empty /> : <BookingsTable bookings={recent} />}
        </CardContent>
      </Card>
    </div>
  );
}

function Bookings({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink">My Bookings</h1>
      <Card><CardContent className="p-0">{bookings.length === 0 ? <div className="p-6"><Empty /></div> : <BookingsTable bookings={bookings} />}</CardContent></Card>
    </div>
  );
}

function BookingsTable({ bookings }: { bookings: Booking[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Trek</TableHead><TableHead>Departure</TableHead><TableHead>Travellers</TableHead>
          <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Ref</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => (
          <TableRow key={b.id}>
            <TableCell className="font-medium text-ink">{b.trek_title ?? "Trek"}</TableCell>
            <TableCell>{fmtDate(b.departure_date)}</TableCell>
            <TableCell>{(b.adults ?? 0) + (b.children ?? 0)}</TableCell>
            <TableCell className="font-semibold text-ink">{rupees(b.grand_total)}</TableCell>
            <TableCell><StatusBadge s={b.status} /></TableCell>
            <TableCell className="text-xs text-gray-400">{b.reference}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Payments({ payments }: { payments: Props["payments"] }) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink">Payment History</h1>
      <Card><CardContent className="p-0">
        {payments.length === 0 ? <div className="p-6"><Empty label="No payments yet." /></div> : (
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{fmtDate(p.date)}</TableCell>
                  <TableCell className="text-xs text-gray-500">{p.reference}</TableCell>
                  <TableCell className="font-semibold text-ink">{rupees(p.amount)}</TableCell>
                  <TableCell><StatusBadge s={p.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}

function Profile({ email, profile }: { email?: string; profile: Record<string, any> }) {
  const fields = [
    { label: "Full name", value: profile.full_name },
    { label: "Email", value: email },
    { label: "Phone", value: profile.phone },
  ];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink">Profile</h1>
      <Card>
        <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <div className="text-xs uppercase tracking-wide text-gray-400">{f.label}</div>
              <div className="mt-1 font-medium text-ink">{f.value || "—"}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      <p className="text-sm text-gray-500">Profile editing is coming soon.</p>
    </div>
  );
}

function Empty({ label = "No bookings yet." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-gray-400"><Mountain size={26} /></div>
      <p className="text-gray-500">{label}</p>
      <Link href="/treks/upcoming-treks"><Button size="sm">Browse treks</Button></Link>
    </div>
  );
}
