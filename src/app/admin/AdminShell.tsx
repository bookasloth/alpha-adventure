"use client";

import { useState } from "react";
import {
  LayoutDashboard, CalendarRange, Inbox, Mountain, Package, FileText, Image as ImageIcon,
  Users, Star, CreditCard, RotateCcw, Banknote, Settings as Cog, Mail, ShieldCheck,
  Search, Bell, ChevronRight, Plus, Filter, MoreHorizontal, TrendingUp, TrendingDown, Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─────────────────────────── nav ─────────────────────────── */
const NAV = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, items: [{ key: "dashboard", label: "Dashboard" }] },
  { key: "bookings", label: "Bookings", icon: Ticket, items: [
    { key: "all-bookings", label: "All Bookings" }, { key: "departures", label: "Departures" }, { key: "leads", label: "Leads" },
  ] },
  { key: "catalog", label: "Catalog", icon: Package, items: [
    { key: "treks", label: "Treks" }, { key: "tours", label: "Tours" }, { key: "content", label: "Content" }, { key: "gallery", label: "Gallery" },
  ] },
  { key: "customers", label: "Customers", icon: Users, items: [
    { key: "all-customers", label: "All Customers" }, { key: "reviews", label: "Reviews" },
  ] },
  { key: "finance", label: "Finance", icon: Banknote, items: [
    { key: "payments", label: "Payments" }, { key: "refunds", label: "Refunds" }, { key: "payouts", label: "Payouts" },
  ] },
  { key: "settings", label: "Settings", icon: Cog, items: [
    { key: "s-general", label: "General" }, { key: "s-email", label: "Email / SMTP" }, { key: "s-payments", label: "Payments" }, { key: "s-team", label: "Team" },
  ] },
] as const;

const PAGE_ICON: Record<string, any> = {
  departures: CalendarRange, leads: Inbox, treks: Mountain, tours: Package, content: FileText,
  gallery: ImageIcon, reviews: Star, refunds: RotateCcw, payouts: Banknote, "s-email": Mail, "s-team": ShieldCheck,
};

/* ─────────────────────────── mock data ─────────────────────────── */
const rupee = (n: number) => "₹" + n.toLocaleString("en-IN");
const BOOKINGS = [
  { ref: "AA-2K5J", customer: "Aditya Rao", trek: "Harishchandragad Trek", date: "26 Sep 2026", pax: 3, amount: 3597, status: "confirmed" },
  { ref: "AA-9F2P", customer: "Sneha Kulkarni", trek: "Kalsubai Peak Trek", date: "12 Oct 2026", pax: 1, amount: 799, status: "pending_payment" },
  { ref: "AA-7C1X", customer: "Rohit Mehta", trek: "Spiti Valley", date: "02 Nov 2026", pax: 2, amount: 51998, status: "confirmed" },
  { ref: "AA-4B8M", customer: "Priya Nair", trek: "Seven Sisters Hill Trek", date: "18 Oct 2026", pax: 4, amount: 4796, status: "completed" },
  { ref: "AA-1D6Q", customer: "Karan Shah", trek: "Harishchandragad Trek", date: "26 Sep 2026", pax: 2, amount: 2598, status: "cancelled" },
  { ref: "AA-3H9Z", customer: "Meera Iyer", trek: "Kalsubai Peak Trek", date: "12 Oct 2026", pax: 5, amount: 3995, status: "confirmed" },
];
const TREKS = [
  { title: "Harishchandragad Trek", region: "Sahyadri", difficulty: "moderate", price: 1299, departures: 6, status: "published" },
  { title: "Kalsubai Peak Trek", region: "Sahyadri", difficulty: "beginner", price: 799, departures: 8, status: "published" },
  { title: "Seven Sisters Hill Trek", region: "Sahyadri", difficulty: "moderate", price: 1199, departures: 4, status: "published" },
  { title: "Spiti Valley", region: "Himalayan", difficulty: "difficult", price: 25999, departures: 2, status: "published" },
  { title: "Rajgad Fort Trek", region: "Sahyadri", difficulty: "beginner", price: 899, departures: 0, status: "draft" },
];
const DEPARTURES = [
  { trek: "Harishchandragad Trek", start: "26 Sep 2026", end: "27 Sep 2026", capacity: 30, booked: 22, status: "open" },
  { trek: "Kalsubai Peak Trek", start: "12 Oct 2026", end: "12 Oct 2026", capacity: 30, booked: 30, status: "full" },
  { trek: "Spiti Valley", start: "02 Nov 2026", end: "09 Nov 2026", capacity: 16, booked: 9, status: "open" },
  { trek: "Seven Sisters Hill Trek", start: "18 Oct 2026", end: "19 Oct 2026", capacity: 25, booked: 4, status: "open" },
];
const CUSTOMERS = [
  { name: "Aditya Rao", email: "aditya@example.com", bookings: 3, spent: 9591, joined: "Jan 2026" },
  { name: "Sneha Kulkarni", email: "sneha@example.com", bookings: 1, spent: 799, joined: "Mar 2026" },
  { name: "Rohit Mehta", email: "rohit@example.com", bookings: 5, spent: 71997, joined: "Nov 2025" },
  { name: "Priya Nair", email: "priya@example.com", bookings: 2, spent: 4796, joined: "Feb 2026" },
];
const LEADS = [
  { name: "Vikram Sethi", email: "vikram@example.com", subject: "Corporate offsite for 40", when: "2h ago", status: "new" },
  { name: "Anjali Desai", email: "anjali@example.com", subject: "Custom Himachal itinerary", when: "5h ago", status: "new" },
  { name: "Farhan Q.", email: "farhan@example.com", subject: "Group discount — Kalsubai", when: "1d ago", status: "replied" },
];
const PAYMENTS = [
  { id: "pay_9Ha2", ref: "AA-2K5J", method: "UPI", amount: 3597, when: "26 Sep", status: "captured" },
  { id: "pay_7Kx1", ref: "AA-7C1X", method: "Card", amount: 51998, when: "24 Sep", status: "captured" },
  { id: "pay_3Lq8", ref: "AA-9F2P", method: "UPI", amount: 799, when: "23 Sep", status: "pending" },
  { id: "pay_1Zt4", ref: "AA-1D6Q", method: "Card", amount: 2598, when: "22 Sep", status: "refunded" },
];
const REVENUE = [
  { m: "Apr", v: 42 }, { m: "May", v: 55 }, { m: "Jun", v: 38 }, { m: "Jul", v: 61 },
  { m: "Aug", v: 72 }, { m: "Sep", v: 85 },
];

const badgeFor = (s: string): "success" | "warning" | "danger" | "neutral" | "brand" => (
  ["confirmed", "completed", "captured", "published", "open", "replied"].includes(s) ? "success"
    : ["pending_payment", "pending", "new", "draft"].includes(s) ? "warning"
    : ["cancelled", "refunded", "full"].includes(s) ? "danger" : "neutral"
);
const label = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const S = ({ s }: { s: string }) => <Badge variant={badgeFor(s)}>{label(s)}</Badge>;

/* ─────────────────────────── shell ─────────────────────────── */
export default function AdminShell() {
  const [section, setSection] = useState("overview");
  const [item, setItem] = useState("dashboard");
  const active = NAV.find((n) => n.key === section)!;

  return (
    <div className="flex h-screen overflow-hidden bg-page text-ink">
      {/* level 1 — icon rail */}
      <nav className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-line bg-ink py-4">
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl2 bg-primary text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 20L9 8l4 7 2-3 6 8z" fill="#fff" /></svg>
        </div>
        {NAV.map((n) => {
          const Icon = n.icon;
          const on = section === n.key;
          return (
            <button key={n.key} title={n.label}
              onClick={() => { setSection(n.key); setItem(n.items[0].key); }}
              className={cn("grid h-11 w-11 place-items-center rounded-xl2 transition-colors",
                on ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/10 hover:text-white")}>
              <Icon size={20} />
            </button>
          );
        })}
      </nav>

      {/* level 2 — secondary nav */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-white sm:flex">
        <div className="flex h-16 items-center px-5 text-lg font-bold">{active.label}</div>
        <div className="flex-1 space-y-0.5 px-3">
          {active.items.map((it) => {
            const on = item === it.key;
            const Icon = PAGE_ICON[it.key];
            return (
              <button key={it.key} onClick={() => setItem(it.key)}
                className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  on ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-slate-100")}>
                {Icon ? <Icon size={16} /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />}
                {it.label}
                {on && <ChevronRight size={15} className="ml-auto" />}
              </button>
            );
          })}
        </div>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">SA</div>
            <div className="min-w-0"><div className="truncate text-sm font-semibold">Shubham</div><div className="truncate text-xs text-gray-400">Owner</div></div>
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-5">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm text-gray-400 max-w-md">
            <Search size={16} /> Search bookings, treks, customers…
          </div>
          <button className="relative grid h-9 w-9 place-items-center rounded-lg text-gray-500 hover:bg-slate-100">
            <Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <Button size="sm"><Plus size={16} /> New booking</Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Page item={item} />
        </main>
      </div>
    </div>
  );
}

/* ─────────────────────────── pages ─────────────────────────── */
function Page({ item }: { item: string }) {
  switch (item) {
    case "dashboard": return <Overview />;
    case "all-bookings": return <BookingsPage />;
    case "departures": return <DeparturesPage />;
    case "leads": return <LeadsPage />;
    case "treks": return <TreksPage />;
    case "all-customers": return <CustomersPage />;
    case "payments": return <PaymentsPage />;
    case "s-general": return <SettingsGeneral />;
    default: return <Stub title={label(item.replace(/^s-/, ""))} />;
  }
}

function PageHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div><h1 className="text-2xl font-bold">{title}</h1>{sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}</div>
      {action}
    </div>
  );
}
function Kpi({ label, value, delta, up = true, icon: Icon }: any) {
  return (
    <Card><CardContent className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={18} /></span>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      {delta && <div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", up ? "text-green-600" : "text-red-500")}>
        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {delta} vs last month</div>}
    </CardContent></Card>
  );
}

function Overview() {
  const max = Math.max(...REVENUE.map((r) => r.v));
  return (
    <div>
      <PageHead title="Dashboard" sub="Snapshot of bookings, revenue and departures." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue (Sep)" value={rupee(285400)} delta="+18%" up icon={Banknote} />
        <Kpi label="Bookings" value="128" delta="+9%" up icon={Ticket} />
        <Kpi label="Upcoming departures" value="14" delta="-2" up={false} icon={CalendarRange} />
        <Kpi label="New customers" value="37" delta="+24%" up icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue — last 6 months</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-3">
              {REVENUE.map((r) => (
                <div key={r.m} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary" style={{ height: `${(r.v / max) * 100}%` }} />
                  <span className="text-xs text-gray-400">{r.m}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Upcoming departures</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {DEPARTURES.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div><div className="font-medium">{d.trek}</div><div className="text-xs text-gray-400">{d.start}</div></div>
                <span className="text-xs font-semibold text-gray-500">{d.booked}/{d.capacity}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Recent bookings</CardTitle><Button variant="ghost" size="sm">View all</Button></CardHeader>
        <CardContent className="p-0"><BookingsTable rows={BOOKINGS.slice(0, 5)} /></CardContent>
      </Card>
    </div>
  );
}

function Toolbar({ tabs }: { tabs: string[] }) {
  const [on, setOn] = useState(0);
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex gap-1 rounded-lg border border-line bg-white p-1">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setOn(i)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", on === i ? "bg-primary text-white" : "text-gray-500 hover:text-ink")}>{t}</button>
        ))}
      </div>
      <button className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm text-gray-500 hover:text-ink"><Filter size={15} /> Filters</button>
      <div className="ml-auto flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-gray-400"><Search size={15} /> Search…</div>
    </div>
  );
}

function BookingsTable({ rows }: { rows: typeof BOOKINGS }) {
  return (
    <Table>
      <TableHeader><TableRow className="hover:bg-transparent">
        <TableHead>Ref</TableHead><TableHead>Customer</TableHead><TableHead>Trek</TableHead><TableHead>Departure</TableHead>
        <TableHead>Pax</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {rows.map((b) => (
          <TableRow key={b.ref}>
            <TableCell className="font-mono text-xs text-gray-500">{b.ref}</TableCell>
            <TableCell className="font-medium text-ink">{b.customer}</TableCell>
            <TableCell>{b.trek}</TableCell>
            <TableCell>{b.date}</TableCell>
            <TableCell>{b.pax}</TableCell>
            <TableCell className="font-semibold text-ink">{rupee(b.amount)}</TableCell>
            <TableCell><S s={b.status} /></TableCell>
            <TableCell className="text-right"><button className="text-gray-400 hover:text-ink"><MoreHorizontal size={16} /></button></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BookingsPage() {
  return (
    <div>
      <PageHead title="Bookings" sub="Every booking across all treks." action={<Button size="sm"><Plus size={16} /> Add booking</Button>} />
      <Toolbar tabs={["All", "Confirmed", "Pending", "Completed", "Cancelled"]} />
      <Card><CardContent className="p-0"><BookingsTable rows={BOOKINGS} /></CardContent></Card>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Showing 1–6 of 128</span>
        <div className="flex gap-1">
          <button className="rounded-md border border-line px-3 py-1.5 hover:bg-slate-100">Prev</button>
          <button className="rounded-md border border-line px-3 py-1.5 hover:bg-slate-100">Next</button>
        </div>
      </div>
    </div>
  );
}

function DeparturesPage() {
  return (
    <div>
      <PageHead title="Departures" sub="Batch schedule and seat occupancy." action={<Button size="sm"><Plus size={16} /> New departure</Button>} />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead>Trek</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Occupancy</TableHead><TableHead>Seats left</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {DEPARTURES.map((d, i) => {
              const pct = Math.round((d.booked / d.capacity) * 100);
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium text-ink">{d.trek}</TableCell>
                  <TableCell>{d.start}</TableCell><TableCell>{d.end}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", pct >= 100 ? "bg-red-500" : "bg-primary")} style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs text-gray-500">{d.booked}/{d.capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-ink">{d.capacity - d.booked}</TableCell>
                  <TableCell><S s={d.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function LeadsPage() {
  return (
    <div>
      <PageHead title="Leads" sub="Enquiries from the contact form and WhatsApp." />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Subject</TableHead><TableHead>Received</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {LEADS.map((l, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium text-ink">{l.name}</TableCell>
                <TableCell className="text-gray-500">{l.email}</TableCell>
                <TableCell>{l.subject}</TableCell>
                <TableCell className="text-gray-400">{l.when}</TableCell>
                <TableCell><S s={l.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function TreksPage() {
  return (
    <div>
      <PageHead title="Treks" sub="Your catalogue — pricing, difficulty and publish state." action={<Button size="sm"><Plus size={16} /> Add trek</Button>} />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Trek</TableHead><TableHead>Region</TableHead><TableHead>Difficulty</TableHead><TableHead>Price</TableHead><TableHead>Departures</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {TREKS.map((t) => (
              <TableRow key={t.title}>
                <TableCell className="font-medium text-ink">{t.title}</TableCell>
                <TableCell>{t.region}</TableCell>
                <TableCell><S s={t.difficulty} /></TableCell>
                <TableCell className="font-semibold text-ink">{rupee(t.price)}</TableCell>
                <TableCell>{t.departures}</TableCell>
                <TableCell><S s={t.status} /></TableCell>
                <TableCell className="text-right"><button className="text-gray-400 hover:text-ink"><MoreHorizontal size={16} /></button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function CustomersPage() {
  return (
    <div>
      <PageHead title="Customers" sub="Everyone who's booked or signed up." />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Bookings</TableHead><TableHead>Total spent</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
          <TableBody>
            {CUSTOMERS.map((c) => (
              <TableRow key={c.email}>
                <TableCell className="flex items-center gap-2 font-medium text-ink">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{c.name[0]}</span>{c.name}
                </TableCell>
                <TableCell className="text-gray-500">{c.email}</TableCell>
                <TableCell>{c.bookings}</TableCell>
                <TableCell className="font-semibold text-ink">{rupee(c.spent)}</TableCell>
                <TableCell className="text-gray-400">{c.joined}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function PaymentsPage() {
  return (
    <div>
      <PageHead title="Payments" sub="Captured, pending and refunded transactions." action={<Button variant="secondary" size="sm">Export CSV</Button>} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Kpi label="Captured (Sep)" value={rupee(285400)} icon={CreditCard} />
        <Kpi label="Pending" value={rupee(799)} icon={RotateCcw} />
        <Kpi label="Refunded" value={rupee(2598)} icon={Banknote} />
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Payment ID</TableHead><TableHead>Booking</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {PAYMENTS.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs text-gray-500">{p.id}</TableCell>
                <TableCell className="font-mono text-xs">{p.ref}</TableCell>
                <TableCell>{p.method}</TableCell>
                <TableCell className="font-semibold text-ink">{rupee(p.amount)}</TableCell>
                <TableCell className="text-gray-400">{p.when}</TableCell>
                <TableCell><S s={p.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 sm:grid-cols-[200px_1fr] sm:items-center">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";
function SettingsGeneral() {
  return (
    <div className="max-w-2xl">
      <PageHead title="General settings" sub="Business identity shown across the site." action={<Button size="sm">Save</Button>} />
      <Card><CardContent className="space-y-4 p-6">
        <Row label="Business name"><input className={inp} defaultValue="Alpha Adventures" /></Row>
        <Row label="Support email"><input className={inp} defaultValue="info@alphaadventures.in" /></Row>
        <Row label="Phone / WhatsApp"><input className={inp} defaultValue="+91 8180001597" /></Row>
        <Row label="Base city"><input className={inp} defaultValue="Nagpur, Maharashtra" /></Row>
        <Row label="Currency"><select className={inp} defaultValue="INR"><option>INR</option><option>USD</option></select></Row>
      </CardContent></Card>
    </div>
  );
}

function Stub({ title }: { title: string }) {
  return (
    <div>
      <PageHead title={title} sub="UI mockup — not wired yet." />
      <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-gray-400"><FileText size={24} /></div>
        <p className="text-gray-500">The <b>{title}</b> screen will live here.</p>
        <Button size="sm" variant="secondary">Configure</Button>
      </CardContent></Card>
    </div>
  );
}
