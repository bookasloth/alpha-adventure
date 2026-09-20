"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Ticket, CreditCard, User, LogOut, Mountain,
  CalendarCheck, Wallet, ChevronRight, X,
} from "lucide-react";
import { signOut } from "../login/actions";
import { updateProfile, getBookingTravellers, cancelBooking } from "./actions";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const rupees = (p?: number | null) => `₹${((p ?? 0) / 100).toLocaleString("en-IN")}`;
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const inputCls = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

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
const CANCELLABLE = new Set(["draft", "pending_auth", "pending_payment", "payment_failed", "deposit_paid", "confirmed"]);
const StatusBadge = ({ s }: { s: string }) => {
  const m = STATUS[s] ?? { label: s, variant: "neutral" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

const NAV = [
  { group: "Account", items: [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "bookings", label: "My Bookings", icon: Ticket },
    { key: "payments", label: "Payments", icon: CreditCard },
  ] },
  { group: "Settings", items: [
    { key: "profile", label: "Profile & Medical", icon: User },
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
  const [detail, setDetail] = useState<Booking | null>(null);
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Trekker";
  const initials = (name === "Trekker" ? email || "T" : name).slice(0, 1).toUpperCase();

  return (
    <div className="min-h-[70vh] bg-page">
      <div className="container-px flex gap-6 py-8">
        {/* SIDEBAR (2-level rail) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl2 border border-line/70 bg-white p-4 shadow-soft">
            <div className="mb-4 flex items-center gap-3 border-b border-line/70 pb-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">{initials}</div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink">{name}</div>
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

        {/* MAIN */}
        <main className="min-w-0 flex-1">
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {NAV.flatMap((g) => g.items).map((it) => (
              <button key={it.key} onClick={() => setTab(it.key)}
                className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", tab === it.key ? "bg-primary text-white" : "bg-white text-gray-600 border border-line")}>
                {it.label}
              </button>
            ))}
          </div>

          {tab === "overview" && <Overview stats={stats} bookings={bookings} onOpen={setDetail} onSeeAll={() => setTab("bookings")} />}
          {tab === "bookings" && <Bookings bookings={bookings} onOpen={setDetail} />}
          {tab === "payments" && <Payments payments={payments} />}
          {tab === "profile" && <ProfileForm email={email} profile={profile} />}
        </main>
      </div>

      {detail && <BookingDetail booking={detail} onClose={() => setDetail(null)} />}
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

function Overview({ stats, bookings, onOpen, onSeeAll }: { stats: Props["stats"]; bookings: Booking[]; onOpen: (b: Booking) => void; onSeeAll: () => void }) {
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
        <CardContent className="p-0">
          {recent.length === 0 ? <div className="p-6"><Empty /></div> : <BookingsTable bookings={recent} onOpen={onOpen} />}
        </CardContent>
      </Card>
    </div>
  );
}

function Bookings({ bookings, onOpen }: { bookings: Booking[]; onOpen: (b: Booking) => void }) {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink">My Bookings</h1>
      <Card><CardContent className="p-0">{bookings.length === 0 ? <div className="p-6"><Empty /></div> : <BookingsTable bookings={bookings} onOpen={onOpen} />}</CardContent></Card>
    </div>
  );
}

function BookingsTable({ bookings, onOpen }: { bookings: Booking[]; onOpen: (b: Booking) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Trek</TableHead><TableHead>Departure</TableHead><TableHead>Travellers</TableHead>
          <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => (
          <TableRow key={b.id} className="cursor-pointer" onClick={() => onOpen(b)}>
            <TableCell className="font-medium text-ink">{b.trek_title ?? "Trek"}</TableCell>
            <TableCell>{fmtDate(b.departure_date)}</TableCell>
            <TableCell>{(b.adults ?? 0) + (b.children ?? 0)}</TableCell>
            <TableCell className="font-semibold text-ink">{rupees(b.grand_total)}</TableCell>
            <TableCell><StatusBadge s={b.status} /></TableCell>
            <TableCell className="text-right text-primary"><ChevronRight size={16} className="inline" /></TableCell>
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

function Field({ label, name, defaultValue, type = "text", placeholder }: { label: string; name: string; defaultValue?: any; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} className={inputCls} />
    </label>
  );
}

function ProfileForm({ email, profile }: { email?: string; profile: Record<string, any> }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    const r = await updateProfile(data);
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Profile &amp; Medical</h1>
        <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
      </div>
      {msg && <div className={cn("rounded-lg px-4 py-2.5 text-sm", msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>{msg.text}</div>}

      <Card>
        <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" name="first_name" defaultValue={profile.first_name} />
          <Field label="Last name" name="last_name" defaultValue={profile.last_name} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Email</span>
            <input value={email ?? ""} disabled className={cn(inputCls, "opacity-60")} />
          </label>
          <Field label="Phone" name="phone" defaultValue={profile.phone} placeholder="+91…" />
          <Field label="Date of birth" name="date_of_birth" type="date" defaultValue={profile.date_of_birth} />
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Gender</span>
            <select name="gender" defaultValue={profile.gender ?? ""} className={inputCls}>
              <option value="">Select</option>
              <option value="male">Male</option><option value="female">Female</option>
              <option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Address</span>
            <input name="address" defaultValue={profile.address ?? ""} className={inputCls} />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fitness &amp; medical</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Blood group" name="blood_group" defaultValue={profile.blood_group} placeholder="e.g. O+" />
          <div />
          <Field label="Emergency contact name" name="emergency_contact_name" defaultValue={profile.emergency_contact_name} />
          <Field label="Emergency contact phone" name="emergency_contact_phone" defaultValue={profile.emergency_contact_phone} placeholder="+91…" />
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Medical conditions / allergies</span>
            <textarea name="medical_conditions" defaultValue={profile.medical_conditions ?? ""} rows={3} className={inputCls} />
          </label>
        </CardContent>
      </Card>
    </form>
  );
}

function BookingDetail({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const router = useRouter();
  const [travellers, setTravellers] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getBookingTravellers(booking.id).then((r) => setTravellers(r.ok ? r.travellers : []));
  }, [booking.id]);

  async function onCancel() {
    if (!confirm("Cancel this booking? This can't be undone.")) return;
    setBusy(true); setErr(null);
    const r = await cancelBooking(booking.id);
    setBusy(false);
    if (r.ok) { onClose(); router.refresh(); } else setErr(r.error);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-card sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">{booking.trek_title ?? "Trek"}</h2>
            <div className="text-sm text-gray-500">Ref {booking.reference}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-slate-100"><X size={20} /></button>
        </div>

        <div className="mb-4"><StatusBadge s={booking.status} /></div>

        <dl className="grid grid-cols-2 gap-3 rounded-xl2 border border-line/70 bg-slate-50 p-4 text-sm">
          <div><dt className="text-gray-400">Departure</dt><dd className="font-medium text-ink">{fmtDate(booking.departure_date)}</dd></div>
          <div><dt className="text-gray-400">Travellers</dt><dd className="font-medium text-ink">{(booking.adults ?? 0) + (booking.children ?? 0)}</dd></div>
          <div><dt className="text-gray-400">Amount</dt><dd className="font-semibold text-ink">{rupees(booking.grand_total)}</dd></div>
          <div><dt className="text-gray-400">Booked on</dt><dd className="font-medium text-ink">{fmtDate(booking.created_at)}</dd></div>
        </dl>

        <div className="mt-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Travellers</div>
          {travellers === null ? <div className="text-sm text-gray-400">Loading…</div>
            : travellers.length === 0 ? <div className="text-sm text-gray-400">No traveller details on file.</div>
            : <ul className="space-y-1.5">
                {travellers.map((t, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-line/70 px-3 py-2 text-sm">
                    <span className="font-medium text-ink">{t.full_name}{t.is_lead && <span className="ml-2 text-xs text-primary">Lead</span>}</span>
                    <span className="text-gray-500">{t.gender || ""}</span>
                  </li>
                ))}
              </ul>}
        </div>

        {err && <div className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{err}</div>}

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
          {CANCELLABLE.has(booking.status) && (
            <Button variant="danger" className="flex-1" disabled={busy} onClick={onCancel}>{busy ? "Cancelling…" : "Cancel booking"}</Button>
          )}
        </div>
      </div>
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
