"use client";

import { useRef, useState } from "react";
import {
  LayoutDashboard, CalendarRange, Inbox, Mountain, Package, FileText, Image as ImageIcon,
  Users, Star, CreditCard, RotateCcw, Banknote, Settings as Cog, Mail, ShieldCheck,
  Search, Bell, ChevronRight, Plus, Filter, MoreHorizontal, TrendingUp, TrendingDown, Ticket,
  X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RevenueArea, StatusDonut, TopTreksBar } from "./Charts";
import GalleryPage, { seedGallery, type GalleryImage } from "./GalleryPage";
import type { AdminData } from "./data";

/* ─────────────────────────── types ─────────────────────────── */
type Booking = { ref: string; customer: string; trek: string; date: string; pax: number; amount: number; status: string };
type Trek = { title: string; region: string; difficulty: string; price: number; departures: number; status: string };
type Departure = { trek: string; start: string; end: string; capacity: number; booked: number; status: string };
type MenuItem = { label: string; onClick: () => void; tone?: "danger" };
type ModalType = "booking" | "departure" | "trek";
type AdminActions = {
  go: (next: string) => void;
  notify: (msg: string) => void;
  addBooking: (b: Omit<Booking, "ref">) => void;
  addTrek: (t: Trek) => void;
  addDeparture: (d: Departure) => void;
  exportCsv: () => void;
  openModal: React.Dispatch<React.SetStateAction<{ type: ModalType } | null>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  gallery: GalleryImage[];
  setGallery: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
  treks: Trek[];
  setTreks: React.Dispatch<React.SetStateAction<Trek[]>>;
  departures: Departure[];
  setDepartures: React.Dispatch<React.SetStateAction<Departure[]>>;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  notifs: { id: number; text: string; when: string }[];
  setNotifs: React.Dispatch<React.SetStateAction<{ id: number; text: string; when: string }[]>>;
  // Real Supabase-backed, read-only slices (kept separate from the editable
  // mock state above, which the add-modals mutate locally).
  kpis: AdminData["kpis"];
  charts: AdminData["charts"];
  leads: AdminData["leadRows"];
  customers: AdminData["customerRows"];
  payments: AdminData["paymentRows"];
};

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
// Treks are not DB-backed yet (no price column) — catalog CRUD is a later phase.
const TREKS: Trek[] = [
  { title: "Harishchandragad Trek", region: "Sahyadri", difficulty: "moderate", price: 1299, departures: 6, status: "published" },
  { title: "Kalsubai Peak Trek", region: "Sahyadri", difficulty: "beginner", price: 799, departures: 8, status: "published" },
  { title: "Seven Sisters Hill Trek", region: "Sahyadri", difficulty: "moderate", price: 1199, departures: 4, status: "published" },
  { title: "Spiti Valley", region: "Himalayan", difficulty: "difficult", price: 25999, departures: 2, status: "published" },
  { title: "Rajgad Fort Trek", region: "Sahyadri", difficulty: "beginner", price: 899, departures: 0, status: "draft" },
];
const NOTIFS = [
  { id: 1, text: "New booking AA-9F2P (Sneha Kulkarni)", when: "2m" },
  { id: 2, text: "Payment captured AA-7C1X ₹51,998", when: "1h" },
  { id: 3, text: "Kalsubai departure 12 Oct is full", when: "3h" },
];

const badgeFor = (s: string): "success" | "warning" | "danger" | "neutral" | "brand" => (
  ["confirmed", "completed", "deposit_paid", "paid", "captured", "published", "open", "scheduled", "replied"].includes(s) ? "success"
    : ["pending_payment", "pending_auth", "pending", "new", "draft"].includes(s) ? "warning"
    : ["cancelled", "refunded", "failed", "expired", "full"].includes(s) ? "danger" : "neutral"
);
const label = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const S = ({ s }: { s: string }) => <Badge variant={badgeFor(s)}>{label(s)}</Badge>;
const genRef = (used: string[]) => {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let ref = "";
  do {
    ref = "AA-" + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (used.some((r) => r === ref));
  return ref;
};

/* ─────────────────────────── shell ─────────────────────────── */
export default function AdminShell({ data }: { data: AdminData }) {
  const [section, setSection] = useState("overview");
  const [item, setItem] = useState("dashboard");
  // Seed editable state from real data (falls back to mock if a slice is empty
  // only for treks, which isn't DB-backed yet).
  const [bookings, setBookings] = useState<Booking[]>(data.bookingRows);
  const [gallery, setGallery] = useState<GalleryImage[]>(seedGallery());
  const [treks, setTreks] = useState<Trek[]>(TREKS);
  const [departures, setDepartures] = useState<Departure[]>(data.departureRows);
  const [notifs, setNotifs] = useState(NOTIFS);
  const [bellOpen, setBellOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<null | { type: ModalType }>(null);
  const [toast, setToast] = useState<string | null>(null);
  const active = NAV.find((n) => n.key === section)!;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3000);
  };

  const addBooking = (b: Omit<Booking, "ref">) => {
    const ref = genRef(bookings.map((x) => x.ref));
    setBookings((prev) => [{ ref, ...b }, ...prev]);
    notify(`Booking ${ref} created`);
  };
  const addTrek = (t: Trek) => {
    setTreks((prev) => [t, ...prev]);
    notify(`Trek “${t.title}” added`);
  };
  const addDeparture = (d: Departure) => {
    setDepartures((prev) => [d, ...prev]);
    notify(`Departure for “${d.trek}” added`);
  };

  const exportCsv = () => {
    const head = "Payment ID,Booking,Method,Amount,Date,Status";
    const lines = data.paymentRows.map((p) => [p.id, p.ref, p.method, p.amount, p.when, p.status].join(","));
    const blob = new Blob([[head, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("payments.csv exported");
  };

  const actions: AdminActions = {
    go: (next: string) => { setSection(NAV.find((n) => n.items.some((i) => i.key === next))?.key ?? section); setItem(next); },
    notify,
    addBooking,
    addTrek,
    addDeparture,
    exportCsv,
    openModal: setModal,
    bookings,
    setBookings,
    gallery,
    setGallery,
    treks,
    setTreks,
    departures,
    setDepartures,
    search,
    setSearch,
    notifs,
    setNotifs,
    kpis: data.kpis,
    charts: data.charts,
    leads: data.leadRows,
    customers: data.customerRows,
    payments: data.paymentRows,
  };

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
        <header className="relative flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-5">
          <div className="relative flex max-w-md flex-1 items-center rounded-lg border border-line bg-slate-50 focus-within:border-primary focus-within:bg-white">
            <Search size={16} className="ml-3 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") actions.go("all-bookings"); }}
              placeholder="Search bookings, treks, customers…"
              className="w-full bg-transparent px-2.5 py-2 text-sm text-ink outline-none" />
          </div>
          <div className="relative">
            <button onClick={() => setBellOpen((v) => !v)} className={cn("relative grid h-9 w-9 place-items-center rounded-lg text-gray-500 hover:bg-slate-100", bellOpen && "bg-slate-100")}>
              <Bell size={18} />
              {notifs.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />}
            </button>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 top-11 z-20 w-80 rounded-xl border border-line bg-white p-2 shadow-xl">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm font-bold">Notifications</span>
                    <button onClick={() => { setNotifs([]); notify("All notifications cleared"); }}
                      className="text-xs font-medium text-primary hover:underline">Clear all</button>
                  </div>
                  {notifs.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-gray-400">No new notifications.</p>
                  ) : notifs.map((n) => (
                    <button key={n.id} onClick={() => { setNotifs((prev) => prev.filter((x) => x.id !== n.id)); setBellOpen(false); notify(`Marked read: ${n.text}`); }}
                      className="block w-full rounded-lg px-2 py-2.5 text-left hover:bg-slate-50">
                      <div className="text-sm text-ink">{n.text}</div>
                      <div className="mt-0.5 text-xs text-gray-400">{n.when} ago</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <Button size="sm" onClick={() => setModal({ type: "booking" })}><Plus size={16} /> New booking</Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Page actions={actions} item={item} />
        </main>
      </div>

      {modal && <EntityModal type={modal.type} treks={actions.treks} onSave={modal.type === "booking" ? actions.addBooking : modal.type === "trek" ? actions.addTrek : actions.addDeparture} onClose={() => setModal(null)} />}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl border border-line bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl">
          <Check size={16} className="text-green-400" /> {toast}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── pages ─────────────────────────── */
function Page({ item, actions }: { item: string; actions: AdminActions }) {
  switch (item) {
    case "dashboard": return <Overview actions={actions} />;
    case "all-bookings": return <BookingsPage actions={actions} />;
    case "departures": return <DeparturesPage actions={actions} />;
    case "leads": return <LeadsPage actions={actions} />;
    case "treks": return <TreksPage actions={actions} />;
    case "gallery": return <GalleryPage items={actions.gallery} setItems={actions.setGallery} notify={actions.notify} />;
    case "all-customers": return <CustomersPage actions={actions} />;
    case "payments": return <PaymentsPage actions={actions} />;
    case "s-general": return <SettingsGeneral notify={actions.notify} />;
    default: return <Stub title={label(item.replace(/^s-/, ""))} notify={actions.notify} />;
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
    <Card><CardContent className="p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={22} /></span>
        <div className="text-2xl font-bold">{value}</div>
      </div>
      {delta && <div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", up ? "text-green-600" : "text-red-500")}>
        {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {delta} vs last month</div>}
    </CardContent></Card>
  );
}

const monthLabel = new Date().toLocaleDateString("en-IN", { month: "short" });

function Overview({ actions }: { actions: AdminActions }) {
  const { kpis, charts } = actions;
  return (
    <div>
      <PageHead title="Dashboard" sub="Snapshot of bookings, revenue and departures." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={`Revenue (${monthLabel})`} value={rupee(kpis.revenueMonth)} icon={Banknote} />
        <Kpi label="Bookings" value={String(kpis.bookings)} icon={Ticket} />
        <Kpi label="Upcoming departures" value={String(kpis.upcomingDepartures)} icon={CalendarRange} />
        <Kpi label="New customers" value={String(kpis.newCustomers)} icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Revenue analytics</CardTitle></CardHeader>
          <CardContent className="pt-0"><RevenueArea sixMonth={charts.revenue} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bookings by status</CardTitle></CardHeader>
          <CardContent className="pt-0"><StatusDonut data={charts.status} /></CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Top treks by bookings</CardTitle></CardHeader>
          <CardContent className="pt-0"><TopTreksBar data={charts.topTreks} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Upcoming departures</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {actions.departures.slice(0, 4).map((d: Departure, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div><div className="font-medium">{d.trek}</div><div className="text-xs text-gray-400">{d.start}</div></div>
                <span className="text-xs font-semibold text-gray-500">{d.booked}/{d.capacity}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent bookings</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => actions.go("all-bookings")}>View all</Button>
        </CardHeader>
        <CardContent className="p-0"><BookingsTable rows={actions.bookings.slice(0, 5)} /></CardContent>
      </Card>
    </div>
  );
}

function Toolbar({
  tabs, tab, onTab, query, onQuery, filtersOpen, onToggleFilters, activeFilters = 0, children,
}: {
  tabs: { key: string; label: string }[];
  tab: string;
  onTab: (key: string) => void;
  query: string;
  onQuery: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilters?: number;
  children?: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-line bg-white p-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => onTab(t.key)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", tab === t.key ? "bg-primary text-white" : "text-gray-500 hover:text-ink")}>{t.label}</button>
          ))}
        </div>
        <button onClick={onToggleFilters} className={cn("flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-sm", filtersOpen ? "border-primary text-primary" : "border-line text-gray-500 hover:text-ink")}>
          <Filter size={15} /> Filters
          {activeFilters > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{activeFilters}</span>}
        </button>
        <div className="relative ml-auto">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search…"
            className="w-56 rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary" />
        </div>
      </div>
      {filtersOpen && <div className="mb-4 rounded-lg border border-line bg-white p-4">{children}</div>}
    </>
  );
}

function RowMenu({ options }: { options: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  if (!options.length) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="grid h-7 w-7 place-items-center rounded-md text-gray-400 hover:bg-slate-100 hover:text-ink" aria-label="Row actions">
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 min-w-40 rounded-lg border border-line bg-white py-1 shadow-xl">
            {options.map((o) => (
              <button key={o.label} onClick={() => { setOpen(false); o.onClick(); }}
                className={cn("block w-full px-3 py-2 text-left text-sm hover:bg-slate-100", o.tone === "danger" ? "text-red-600" : "text-ink")}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BookingsTable({ rows, rowMenu }: { rows: Booking[]; rowMenu?: (b: Booking) => MenuItem[] }) {
  return (
    <Table>
      <TableHeader><TableRow className="hover:bg-transparent">
        <TableHead>Ref</TableHead><TableHead>Customer</TableHead><TableHead>Trek</TableHead><TableHead>Departure</TableHead>
        <TableHead>Pax</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead>
        {rowMenu && <TableHead></TableHead>}
      </TableRow></TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={rowMenu ? 8 : 7} className="py-10 text-center text-gray-400">No bookings match your filters.</TableCell>
          </TableRow>
        ) : rows.map((b) => (
          <TableRow key={b.ref}>
            <TableCell className="font-mono text-xs text-gray-500">{b.ref}</TableCell>
            <TableCell className="font-medium text-ink">{b.customer}</TableCell>
            <TableCell>{b.trek}</TableCell>
            <TableCell>{b.date}</TableCell>
            <TableCell>{b.pax}</TableCell>
            <TableCell className="font-semibold text-ink">{rupee(b.amount)}</TableCell>
            <TableCell><S s={b.status} /></TableCell>
            {rowMenu && <TableCell className="text-right">{<RowMenu options={rowMenu(b)} />}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const BOOKING_TABS = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "pending_payment", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];
const BOOKING_TAB_STATUS: Record<string, string> = {
  all: "", confirmed: "confirmed", pending_payment: "pending_payment", completed: "completed", cancelled: "cancelled",
};
const selectCls = "rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:bg-white";
const PAGE_SIZE = 4;

function BookingsPage({ actions }: { actions: AdminActions }) {
  const [tab, setTab] = useState("all");
  const [trek, setTrek] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);

  const { bookings, setBookings, setSearch, notify, openModal } = actions;
  const query = actions.search;
  const trekOptions: string[] = [...new Set(bookings.map((b: Booking) => b.trek))];
  const status = BOOKING_TAB_STATUS[tab];
  const q = query.trim().toLowerCase();
  const rows = bookings.filter((b: Booking) =>
    (!status || b.status === status) &&
    (trek === "all" || b.trek === trek) &&
    (!q || [b.ref, b.customer, b.trek, b.date].join(" ").toLowerCase().includes(q)),
  );
  const maxPage = Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1);
  const safePage = Math.min(page, maxPage);
  const pageRows = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const clearFilters = () => { setTab("all"); setTrek("all"); setSearch(""); setPage(0); };

  const rowMenu = (b: Booking): MenuItem[] => [
    { label: "View booking", onClick: () => notify(`Opening ${b.ref} (${b.customer})…`) },
    ...(b.status !== "cancelled" ? [{
      label: "Cancel booking", tone: "danger" as const,
      onClick: () => { setBookings((prev: Booking[]) => prev.map((x) => x.ref === b.ref ? { ...x, status: "cancelled" } : x)); notify(`${b.ref} cancelled`); },
    }] : []),
  ];

  return (
    <div>
      <PageHead title="Bookings" sub="Every booking across all treks." action={<Button size="sm" onClick={() => openModal({ type: "booking" })}><Plus size={16} /> Add booking</Button>} />
      <Toolbar
        tabs={BOOKING_TABS}
        tab={tab}
        onTab={(k) => { setTab(k); setPage(0); }}
        query={query}
        onQuery={(v) => { setSearch(v); setPage(0); }}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
        activeFilters={trek === "all" ? 0 : 1}
      >
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-gray-500">Trek</span>
            <select className={selectCls} value={trek} onChange={(e) => { setTrek(e.target.value); setPage(0); }}>
              <option value="all">All treks</option>
              {trekOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <button onClick={clearFilters} className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-gray-500 hover:bg-slate-100">Clear filters</button>
        </div>
      </Toolbar>
      <Card><CardContent className="p-0"><BookingsTable rows={pageRows} rowMenu={rowMenu} /></CardContent></Card>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>{rows.length === 0 ? `Showing 0 of ${bookings.length}` : `Showing ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, rows.length)} of ${rows.length}`}</span>
        <div className="flex gap-1">
          <button disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="rounded-md border border-line px-3 py-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Prev</button>
          <button disabled={safePage === maxPage || rows.length === 0} onClick={() => setPage(safePage + 1)} className="rounded-md border border-line px-3 py-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}

function DeparturesPage({ actions }: { actions: AdminActions }) {
  return (
    <div>
      <PageHead title="Departures" sub="Batch schedule and seat occupancy." action={<Button size="sm" onClick={() => actions.openModal({ type: "departure" })}><Plus size={16} /> New departure</Button>} />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent">
            <TableHead>Trek</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Occupancy</TableHead><TableHead>Seats left</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {actions.departures.length === 0 ? (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="py-10 text-center text-gray-400">No departures yet — add one.</TableCell></TableRow>
            ) : actions.departures.map((d: Departure, i: number) => {
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

function LeadsPage({ actions }: { actions: AdminActions }) {
  const leads = actions.leads;
  return (
    <div>
      <PageHead title="Leads" sub="Enquiries from the contact form and WhatsApp." />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Subject</TableHead><TableHead>Received</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {leads.length === 0 && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-10 text-center text-gray-400">No leads yet.</TableCell></TableRow>
            )}
            {leads.map((l, i) => (
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

function TreksPage({ actions }: { actions: AdminActions }) {
  const { treks, setTreks, notify, openModal } = actions;
  const rowMenu = (t: Trek): MenuItem[] => [
    { label: "Duplicate", onClick: () => { setTreks((prev: Trek[]) => [{ ...t, title: `${t.title} (copy)`, status: "draft" }, ...prev]); notify(`Duplicated "${t.title}"`); } },
    {
      label: t.status === "published" ? "Unpublish" : "Publish",
      onClick: () => { setTreks((prev: Trek[]) => prev.map((x) => x.title === t.title ? { ...x, status: t.status === "published" ? "draft" : "published" } : x)); notify(`"${t.title}" ${t.status === "published" ? "unpublished" : "published"}`); },
    },
  ];
  return (
    <div>
      <PageHead title="Treks" sub="Your catalogue — pricing, difficulty and publish state." action={<Button size="sm" onClick={() => openModal({ type: "trek" })}><Plus size={16} /> Add trek</Button>} />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Trek</TableHead><TableHead>Region</TableHead><TableHead>Difficulty</TableHead><TableHead>Price</TableHead><TableHead>Departures</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {treks.map((t: Trek) => (
              <TableRow key={t.title}>
                <TableCell className="font-medium text-ink">{t.title}</TableCell>
                <TableCell>{t.region}</TableCell>
                <TableCell><S s={t.difficulty} /></TableCell>
                <TableCell className="font-semibold text-ink">{rupee(t.price)}</TableCell>
                <TableCell>{t.departures}</TableCell>
                <TableCell><S s={t.status} /></TableCell>
                <TableCell className="text-right"><RowMenu options={rowMenu(t)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}

function CustomersPage({ actions }: { actions: AdminActions }) {
  const customers = actions.customers;
  return (
    <div>
      <PageHead title="Customers" sub="Everyone who's booked or signed up." />
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Bookings</TableHead><TableHead>Total spent</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
          <TableBody>
            {customers.length === 0 && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-10 text-center text-gray-400">No customers yet.</TableCell></TableRow>
            )}
            {customers.map((c) => (
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

function PaymentsPage({ actions }: { actions: AdminActions }) {
  const pays = actions.payments;
  const sum = (pred: (s: string) => boolean) => pays.filter((p) => pred(p.status)).reduce((s, p) => s + p.amount, 0);
  const captured = sum((s) => ["captured", "paid", "success"].includes(s));
  const pending = sum((s) => ["pending", "processing"].includes(s));
  const refunded = sum((s) => s === "refunded");
  return (
    <div>
      <PageHead title="Payments" sub="Captured, pending and refunded transactions." action={<Button variant="secondary" size="sm" onClick={actions.exportCsv}>Export CSV</Button>} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Kpi label="Captured" value={rupee(captured)} icon={CreditCard} />
        <Kpi label="Pending" value={rupee(pending)} icon={RotateCcw} />
        <Kpi label="Refunded" value={rupee(refunded)} icon={Banknote} />
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Payment ID</TableHead><TableHead>Booking</TableHead><TableHead>Method</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {pays.length === 0 && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={6} className="py-10 text-center text-gray-400">No payments yet.</TableCell></TableRow>
            )}
            {pays.map((p) => (
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

/* ─────────────────────────── forms ─────────────────────────── */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 sm:grid-cols-[200px_1fr] sm:items-center">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

function EntityModal({ type, treks, onSave, onClose }: {
  type: ModalType;
  treks: Trek[];
  onSave: (payload: any) => void;
  onClose: () => void;
}) {
  const [b, setB] = useState({ customer: "", trek: treks[0]?.title ?? "", date: "", pax: 1, amount: "", status: "pending_payment" });
  const [t, setT] = useState({ title: "", region: "Sahyadri", difficulty: "beginner", price: "", departures: 0, status: "draft" });
  const [d, setD] = useState({ trek: treks[0]?.title ?? "", start: "", end: "", capacity: 30, booked: 0, status: "open" });

  const titles = type === "booking" ? "Add booking" : type === "trek" ? "Add trek" : "New departure";
  const themes = {
    booking: {
      subtitle: "Create a new booking record.", submit: "Save booking",
      accepts: () => !!b.customer.trim() && !!b.trek,
      commit: () => onSave({ customer: b.customer.trim(), trek: b.trek, date: b.date || "—", pax: Number(b.pax) || 1, amount: Number(b.amount) || 0, status: b.status }),
    },
    trek: {
      subtitle: "Add a trek to the catalogue.", submit: "Save trek",
      accepts: () => !!t.title.trim(),
      commit: () => onSave({ title: t.title.trim(), region: t.region, difficulty: t.difficulty, price: Number(t.price) || 0, departures: Number(t.departures) || 0, status: t.status }),
    },
    departure: {
      subtitle: "Schedule a new batch.", submit: "Save departure",
      accepts: () => !!d.trek && !!d.start.trim(),
      commit: () => onSave({ trek: d.trek, start: d.start, end: d.end || d.start, capacity: Number(d.capacity) || 1, booked: Number(d.booked) || 0, status: d.status }),
    },
  } as const;
  const theme = themes[type];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-label={titles}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titles}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-gray-400 hover:bg-slate-100 hover:text-ink"><X size={18} /></button>
        </div>
        <p className="mb-5 text-sm text-gray-500">{theme.subtitle}</p>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (theme.accepts()) { theme.commit(); onClose(); } }}>
          {type === "booking" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Customer</span>
                  <input className={inp} value={b.customer} onChange={(e) => setB({ ...b, customer: e.target.value })} placeholder="Full name" />
                </label>
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Trek</span>
                  <select className={inp} value={b.trek} onChange={(e) => setB({ ...b, trek: e.target.value })}>
                    {treks.map((x) => <option key={x.title} value={x.title}>{x.title}</option>)}
                    {!treks.some((x) => x.title === b.trek) && <option value={b.trek}>{b.trek}</option>}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Date</span>
                  <input className={inp} value={b.date} onChange={(e) => setB({ ...b, date: e.target.value })} placeholder="26 Sep 2026" />
                </label>
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Pax</span>
                  <input type="number" min={1} className={inp} value={b.pax} onChange={(e) => setB({ ...b, pax: Number(e.target.value) })} />
                </label>
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Amount (₹)</span>
                  <input type="number" min={0} className={inp} value={b.amount} onChange={(e) => setB({ ...b, amount: e.target.value })} placeholder="1299" />
                </label>
              </div>
              <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Status</span>
                <select className={inp} value={b.status} onChange={(e) => setB({ ...b, status: e.target.value })}>
                  <option value="confirmed">Confirmed</option><option value="pending_payment">Pending payment</option>
                  <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                </select>
              </label>
            </>
          )}
          {type === "trek" && (
            <>
              <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Trek title</span>
                <input className={inp} value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="Sandhan Valley Trek" />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Region</span>
                  <input className={inp} value={t.region} onChange={(e) => setT({ ...t, region: e.target.value })} placeholder="Sahyadri" />
                </label>
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Difficulty</span>
                  <select className={inp} value={t.difficulty} onChange={(e) => setT({ ...t, difficulty: e.target.value })}>
                    <option>beginner</option><option>moderate</option><option>difficult</option>
                  </select>
                </label>
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Price (₹)</span>
                  <input type="number" min={0} className={inp} value={t.price} onChange={(e) => setT({ ...t, price: e.target.value })} placeholder="1299" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Departures</span>
                  <input type="number" min={0} className={inp} value={t.departures} onChange={(e) => setT({ ...t, departures: Number(e.target.value) })} />
                </label>
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Status</span>
                  <select className={inp} value={t.status} onChange={(e) => setT({ ...t, status: e.target.value })}>
                    <option>draft</option><option>published</option>
                  </select>
                </label>
              </div>
            </>
          )}
          {type === "departure" && (
            <>
              <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Trek</span>
                <select className={inp} value={d.trek} onChange={(e) => setD({ ...d, trek: e.target.value })}>
                  {treks.map((x) => <option key={x.title} value={x.title}>{x.title}</option>)}
                  {!treks.some((x) => x.title === d.trek) && <option value={d.trek}>{d.trek}</option>}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Start</span>
                  <input className={inp} value={d.start} onChange={(e) => setD({ ...d, start: e.target.value })} placeholder="02 Nov 2026" />
                </label>
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">End</span>
                  <input className={inp} value={d.end} onChange={(e) => setD({ ...d, end: e.target.value })} placeholder="09 Nov 2026" />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Capacity</span>
                  <input type="number" min={1} className={inp} value={d.capacity} onChange={(e) => setD({ ...d, capacity: Number(e.target.value) })} />
                </label>
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Booked</span>
                  <input type="number" min={0} className={inp} value={d.booked} onChange={(e) => setD({ ...d, booked: Number(e.target.value) })} />
                </label>
                <label className="grid gap-1.5"><span className="text-xs font-medium text-gray-500">Status</span>
                  <select className={inp} value={d.status} onChange={(e) => setD({ ...d, status: e.target.value })}>
                    <option>open</option><option>full</option>
                  </select>
                </label>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm">{theme.submit}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsGeneral({ notify }: { notify: (m: string) => void }) {
  const [saved, setSaved] = useState(false);
  const save = () => {
    setSaved(true);
    notify("Settings saved");
    setTimeout(() => setSaved(false), 2500);
  };
  return (
    <div className="max-w-2xl">
      <PageHead title="General settings" sub="Business identity shown across the site." action={
        <Button size="sm" onClick={save}>{saved ? <><Check size={15} /> Saved</> : "Save"}</Button>
      } />
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

function Stub({ title, notify }: { title: string; notify: (m: string) => void }) {
  return (
    <div>
      <PageHead title={title} sub="UI mockup — not wired yet." />
      <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-gray-400"><FileText size={24} /></div>
        <p className="text-gray-500">The <b>{title}</b> screen will live here.</p>
        <Button size="sm" variant="secondary" onClick={() => notify(`The ${title} screen is on the roadmap.`)}>Configure</Button>
      </CardContent></Card>
    </div>
  );
}