"use client";

import { revealOnMount } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Trash2, ArrowLeft, Check, Sparkles, Compass, Star,
  ListChecks, Package, CalendarDays, MapPin, Bus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTrek } from "./actions";
import ImageField from "@/app/admin/ImageField";
import BoardingEditor, { boardingPayload, type BoardingRow } from "../BoardingEditor";

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const inr = (v: string) => (v && Number(v) > 0 ? Number(v).toLocaleString("en-IN") : "—");

type Pkg = { name: string; price: string; inclusions: string; cta_label: string };
type Dep = { start_date: string; end_date: string; start_time: string; capacity: string; price_override: string; status: string };
const DEP_STATUS = ["open", "scheduled", "full", "closed", "cancelled", "completed"];
const DIFF: { v: string; label: string; dot: string }[] = [
  { v: "beginner", label: "Beginner", dot: "#16a34a" },
  { v: "moderate", label: "Moderate", dot: "#FFB52A" },
  { v: "difficult", label: "Difficult", dot: "#dc2626" },
];

function Field({ label, children, hint, required }: { label: string; children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <label className="grid gap-1.5 min-w-0">
      <span className="text-xs font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
        {hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

// Simple string-list repeater (highlights / inclusions / exclusions).
function ListRepeater({ items, setItems, placeholder, addLabel = "Add row" }: { items: string[]; setItems: (v: string[]) => void; placeholder: string; addLabel?: string }) {
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input className={inp} value={v} placeholder={placeholder}
            onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-gray-400 transition hover:border-red-200 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, ""])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"><Plus size={15} /> {addLabel}</button>
    </div>
  );
}

// A form section with an icon header + completion badge; `id` anchors the rail.
function SectionCard({ id, icon, title, optional, badge, children }: {
  id: string; icon: React.ReactNode; title: string; optional?: boolean; badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[90px] rounded-2xl border border-line bg-white shadow-soft">
      <div className="flex items-center gap-2.5 border-b border-line/70 px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-primary/10 text-primary">{icon}</span>
        <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
        {optional && <span className="text-[11px] font-medium text-gray-400">optional</span>}
        <span className="ml-auto">{badge}</span>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const SECTIONS = [
  { id: "s-basics", label: "Essentials", req: "4 req" },
  { id: "s-facts", label: "Trek facts", req: "opt" },
  { id: "s-highlights", label: "Highlights", req: "opt" },
  { id: "s-incl", label: "Inclusions", req: "opt" },
  { id: "s-pkg", label: "Packages", req: "opt" },
  { id: "s-boarding", label: "Boarding", req: "opt" },
  { id: "s-dates", label: "Dates", req: "1 req" },
];

export default function NewTrekForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [summary, setSummary] = useState("");
  const [overview, setOverview] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [difficulty, setDifficulty] = useState("moderate");
  const [status, setStatus] = useState("draft");
  const [group, setGroup] = useState("sahyadri");
  const [tags, setTags] = useState("");
  const [badge, setBadge] = useState("");

  const [region, setRegion] = useState("");
  const [location, setLocation] = useState("");
  const [state, setState] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [altitude, setAltitude] = useState("");
  const [baseCamp, setBaseCamp] = useState("");
  const [bestSeason, setBestSeason] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [featured, setFeatured] = useState(false);
  const [suitableAge, setSuitableAge] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [fitnessCriteria, setFitnessCriteria] = useState("");
  const [brochureUrl, setBrochureUrl] = useState("");
  const [notToMiss, setNotToMiss] = useState<string[]>([""]);

  const [inclusions, setInclusions] = useState<string[]>([""]);
  const [exclusions, setExclusions] = useState<string[]>([""]);
  const [packages, setPackages] = useState<Pkg[]>([{ name: "Standard Batch", price: "", inclusions: "", cta_label: "Book Now" }]);
  const [boarding, setBoarding] = useState<BoardingRow[]>([]);
  const [boardingDisclaimer, setBoardingDisclaimer] = useState("");
  const [departures, setDepartures] = useState<Dep[]>([{ start_date: "", end_date: "", start_time: "", capacity: "30", price_override: "", status: "open" }]);

  const onTitle = (v: string) => { setTitle(v); if (!slugEdited) setSlug(slugify(v)); };

  // ── Completion: which of the 8 essentials are filled (drives ring + rail). ──
  const essentials = useMemo(() => [
    !!title.trim(), !!slug.trim(), !!summary.trim(), !!heroImage.trim(),
    Number(basePrice) > 0, !!difficulty, !!group, departures.some((d) => d.start_date.trim()),
  ], [title, slug, summary, heroImage, basePrice, difficulty, group, departures]);
  const doneCount = essentials.filter(Boolean).length;
  const pct = Math.round((doneCount / essentials.length) * 100);
  const basicsCount = essentials.slice(0, 4).filter(Boolean).length + (Number(basePrice) > 0 ? 1 : 0);
  const sectionDone: Record<string, boolean> = {
    "s-basics": essentials.slice(0, 7).every(Boolean),
    "s-dates": departures.some((d) => d.start_date.trim()),
  };

  // ── Scroll-spy for the section rail. ──
  const [active, setActive] = useState("s-basics");
  useEffect(() => {
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const clean = (arr: string[]) => arr.map((s) => s.trim()).filter(Boolean);
    const input = {
      title, slug, summary, overview, hero_image: heroImage,
      base_price: basePrice, difficulty, status,
      group, tags: clean(tags.split(/[\n,]/)), badge,
      region, location, state,
      duration_days: durationDays || undefined,
      altitude, base_camp: baseCamp, best_season: bestSeason, group_size: groupSize, featured,
      suitable_age: suitableAge, accommodation, fitness_criteria: fitnessCriteria,
      brochure_url: brochureUrl, not_to_miss: clean(notToMiss),
      inclusions: clean(inclusions),
      exclusions: clean(exclusions),
      packages: packages
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name.trim(),
          price: p.price,
          inclusions: clean(p.inclusions.split(/[\n,]/)),
          cta_label: p.cta_label.trim() || "Book Now",
        })),
      boarding: boardingPayload(boarding),
      boarding_disclaimer: boardingDisclaimer,
      departures: departures
        .filter((d) => d.start_date.trim())
        .map((d) => ({
          start_date: d.start_date,
          end_date: d.end_date,
          start_time: d.start_time,
          capacity: d.capacity,
          price_override: d.price_override,
          status: d.status,
        })),
    };
    try {
      const r = await createTrek(input);
      if (r.ok) router.push("/admin"); // back to dashboard; trek live at /treks/<slug>
      else { setError(r.error); setBusy(false); }
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const activeDiff = DIFF.find((d) => d.v === difficulty) ?? DIFF[1];

  return (
    <form onSubmit={submit}>
      {/* ── Sticky action bar ── */}
      <div className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/admin" aria-label="Back to admin" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-gray-500 transition hover:bg-slate-100 hover:text-ink"><ArrowLeft size={18} /></Link>
          <div className="min-w-0">
            <div className="text-[15px] font-bold leading-tight text-ink">Add trek</div>
            <div className="hidden items-center gap-1.5 text-[11.5px] text-gray-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {slug ? <>live at <span className="font-medium text-gray-500">/treks/{slug}</span></> : "unsaved draft"}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden rounded-full border border-line bg-slate-50 p-0.5 sm:inline-flex" role="group" aria-label="Status">
              {(["draft", "published"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setStatus(v)} aria-pressed={status === v}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${status === v ? (v === "published" ? "bg-white text-green-600 shadow-soft" : "bg-white text-ink shadow-soft") : "text-gray-400 hover:text-ink"}`}>{v}</button>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin")}>Cancel</Button>
            <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save trek"}</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_360px]">
        {/* ── Left rail ── */}
        <aside className="hidden flex-col gap-4 lg:flex">
          <div className="sticky top-[88px] flex flex-col gap-4">
            <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid shrink-0 place-items-center rounded-full"
                  style={{ background: `conic-gradient(#fe5100 ${pct}%, #eef0f3 0)`, width: 52, height: 52 }}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[13px] font-semibold tabular-nums">{pct}%</span>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold tracking-tight text-ink">{pct === 100 ? "Ready to publish" : "In progress"}</h3>
                  <p className="mt-0.5 text-[11.5px] text-gray-400">{doneCount} of {essentials.length} essentials done</p>
                </div>
              </div>
            </div>
            <nav className="flex flex-col gap-0.5">
              {SECTIONS.map((s) => (
                <button key={s.id} type="button" onClick={() => jump(s.id)}
                  className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[13px] transition ${active === s.id ? "border-primary/20 bg-primary/10 font-semibold text-primary" : "border-transparent font-medium text-gray-500 hover:bg-slate-50 hover:text-ink"}`}>
                  <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${sectionDone[s.id] ? "border-green-500 bg-green-500 text-white" : "border-line"}`}>
                    {sectionDone[s.id] && <Check size={9} strokeWidth={3.5} />}
                  </span>
                  {s.label}
                  <span className="ml-auto font-mono text-[10px] text-gray-400">{s.req}</span>
                </button>
              ))}
            </nav>
            <p className="px-1 text-[11.5px] leading-relaxed text-gray-400"><span className="font-semibold text-gray-500">Tip.</span> A trek needs Essentials + one date to publish. Everything else is optional and can wait.</p>
          </div>
        </aside>

        {/* ── Center: form ── */}
        <main className="flex min-w-0 flex-col gap-5">
          {error && <div ref={revealOnMount} role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <SectionCard id="s-basics" icon={<Sparkles size={16} />} title="Essentials"
            badge={<span className="rounded-full border border-line bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-gray-500">{basicsCount}/5</span>}>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Trek name" required><input className={inp} value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Harishchandragad Trek" /></Field>
                <Field label="URL slug" hint="· auto from name"><input className={inp} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} placeholder="harishchandragad-trek" /></Field>
              </div>
              <Field label="Card summary" required hint="· one line, shown on listings"><input className={inp} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A weekend night trek to the Konkan Kada cliff." /></Field>
              <Field label="Overview" hint="· full description on the trek page"><textarea className={`${inp} min-h-28`} value={overview} onChange={(e) => setOverview(e.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hero image" required><ImageField className={inp} value={heroImage} onChange={setHeroImage} folder="treks" placeholder="/assets/img/... or upload" /></Field>
                <Field label="Base price" required>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 font-mono text-sm text-gray-400">₹</span>
                    <input type="number" min={0} className={`${inp} pl-7`} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="1299" />
                  </div>
                </Field>
              </div>
              <div>
                <span className="mb-2 block text-xs font-semibold text-ink">Difficulty <span className="text-primary">*</span></span>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty">
                  {DIFF.map((d) => (
                    <button key={d.v} type="button" onClick={() => setDifficulty(d.v)} aria-pressed={difficulty === d.v}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${difficulty === d.v ? "border-primary bg-primary text-white" : "border-line bg-slate-50 text-gray-500 hover:border-gray-300"}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: difficulty === d.v ? "#fff" : d.dot }} />{d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Listing section" required><select className={inp} value={group} onChange={(e) => setGroup(e.target.value)}><option value="sahyadri">Sahyadri</option><option value="himalayan">Himalayan</option><option value="central">Central India</option><option value="backpacking">Backpacking</option><option value="near-nagpur">Near Nagpur</option></select></Field>
                <Field label="Tags" hint="· comma"><input className={inp} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fort, night, monsoon" /></Field>
                <Field label="Badge" hint="· optional"><input className={inp} value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Bestseller" /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" className="h-4 w-4 accent-primary" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Feature on the homepage</label>
            </div>
          </SectionCard>

          <SectionCard id="s-facts" icon={<Compass size={16} />} title="Trek facts" optional>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Region"><input className={inp} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Sahyadri" /></Field>
              <Field label="Location"><input className={inp} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Khireshwar" /></Field>
              <Field label="State"><input className={inp} value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" /></Field>
              <Field label="Duration" hint="· days"><input type="number" min={0} className={inp} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="2" /></Field>
              <Field label="Altitude"><input className={inp} value={altitude} onChange={(e) => setAltitude(e.target.value)} placeholder="1424 m (4674 ft)" /></Field>
              <Field label="Base camp"><input className={inp} value={baseCamp} onChange={(e) => setBaseCamp(e.target.value)} placeholder="Khireshwar Village" /></Field>
              <Field label="Best season"><input className={inp} value={bestSeason} onChange={(e) => setBestSeason(e.target.value)} placeholder="June - February" /></Field>
              <Field label="Group size"><input className={inp} value={groupSize} onChange={(e) => setGroupSize(e.target.value)} placeholder="15 - 30 trekkers" /></Field>
              <Field label="Suitable age"><input className={inp} value={suitableAge} onChange={(e) => setSuitableAge(e.target.value)} placeholder="15 – 55 years" /></Field>
              <Field label="Accommodation"><input className={inp} value={accommodation} onChange={(e) => setAccommodation(e.target.value)} placeholder="Tent / cave stay" /></Field>
              <div className="sm:col-span-2"><Field label="Fitness criteria"><input className={inp} value={fitnessCriteria} onChange={(e) => setFitnessCriteria(e.target.value)} placeholder="Able to walk 8–10 km with a light backpack" /></Field></div>
            </div>
          </SectionCard>

          <SectionCard id="s-highlights" icon={<Star size={16} />} title="Highlights & brochure" optional>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-ink">Not to miss</p>
                <ListRepeater items={notToMiss} setItems={setNotToMiss} placeholder="Konkan Kada cliff at sunrise" addLabel="Add highlight" />
              </div>
              <Field label="Brochure / itinerary PDF" hint="· URL"><input className={inp} value={brochureUrl} onChange={(e) => setBrochureUrl(e.target.value)} placeholder="https://… .pdf" /></Field>
            </div>
          </SectionCard>

          <SectionCard id="s-incl" icon={<ListChecks size={16} />} title="Inclusions & exclusions">
            <div className="grid gap-6 sm:grid-cols-2">
              <div><p className="mb-2 text-xs font-semibold text-green-600">✓ What&apos;s included</p><ListRepeater items={inclusions} setItems={setInclusions} placeholder="Return transport from Nagpur" addLabel="Add" /></div>
              <div><p className="mb-2 text-xs font-semibold text-amber-600">✕ What&apos;s not included</p><ListRepeater items={exclusions} setItems={setExclusions} placeholder="Personal expenses & tips" addLabel="Add" /></div>
            </div>
          </SectionCard>

          <SectionCard id="s-pkg" icon={<Package size={16} />} title="Pricing packages">
            <div className="space-y-4">
              {packages.map((p, i) => (
                <div key={i} className="rounded-xl border border-line bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Package {i + 1}</span>
                    <button type="button" onClick={() => setPackages(packages.filter((_, j) => j !== i))}
                      className="text-gray-400 transition hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Name"><input className={inp} value={p.name} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Standard Batch" /></Field>
                    <Field label="Price" hint="· ₹"><input type="number" min={0} className={inp} value={p.price} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} placeholder="1299" /></Field>
                    <Field label="Button label"><input className={inp} value={p.cta_label} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, cta_label: e.target.value } : x))} /></Field>
                  </div>
                  <div className="mt-3"><Field label="Inclusions" hint="· one per line or comma-separated"><textarea className={`${inp} min-h-20`} value={p.inclusions} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, inclusions: e.target.value } : x))} placeholder={"Return transport\nTrek leaders & permits"} /></Field></div>
                </div>
              ))}
              <button type="button" onClick={() => setPackages([...packages, { name: "", price: "", inclusions: "", cta_label: "Book Now" }])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"><Plus size={15} /> Add package</button>
            </div>
          </SectionCard>

          <SectionCard id="s-boarding" icon={<Bus size={16} />} title="Boarding locations" optional>
            <BoardingEditor rows={boarding} setRows={setBoarding} disclaimer={boardingDisclaimer} setDisclaimer={setBoardingDisclaimer} />
          </SectionCard>

          <SectionCard id="s-dates" icon={<CalendarDays size={16} />} title="Dates" optional>
            <div className="space-y-4">
              <p className="-mt-1 text-[11.5px] text-gray-400">Departures / batches — each date books independently. Add at least one to let people book.</p>
              {departures.map((d, i) => (
                <div key={i} className="rounded-xl border border-line bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-ink">Batch {i + 1}
                      <span className="rounded-full bg-green-100 px-2 py-0.5 font-mono text-[10px] font-semibold capitalize text-green-700">{d.status}</span></span>
                    <button type="button" onClick={() => setDepartures(departures.filter((_, j) => j !== i))}
                      className="text-gray-400 transition hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Start date" required><input type="date" className={inp} value={d.start_date} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, start_date: e.target.value } : x))} /></Field>
                    <Field label="End date" hint="· optional"><input type="date" className={inp} value={d.end_date} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, end_date: e.target.value } : x))} /></Field>
                    <Field label="Start time" hint="· optional"><input className={inp} value={d.start_time} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, start_time: e.target.value } : x))} placeholder="10:00 PM" /></Field>
                    <Field label="Capacity" hint="· seats"><input type="number" min={1} className={inp} value={d.capacity} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, capacity: e.target.value } : x))} /></Field>
                    <Field label="Price override" hint="· ₹, blank = base"><input type="number" min={0} className={inp} value={d.price_override} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, price_override: e.target.value } : x))} placeholder="base price" /></Field>
                    <Field label="Status"><select className={inp} value={d.status} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, status: e.target.value } : x))}>{DEP_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setDepartures([...departures, { start_date: "", end_date: "", start_time: "", capacity: "30", price_override: "", status: "open" }])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"><Plus size={15} /> Add another date</button>
            </div>
          </SectionCard>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => router.push("/admin")}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save trek"}</Button>
          </div>
        </main>

        {/* ── Right: live preview ── */}
        <aside className="hidden xl:block">
          <div className="sticky top-[88px] flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> Live preview
            </div>
            <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-card">
              <div className="relative aspect-[16/10] bg-slate-200"
                style={heroImage ? { backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {!heroImage && <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">Hero image</div>}
                {badge.trim() && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wide text-ink">{badge}</span>}
                <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10.5px] font-semibold text-white backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: activeDiff.dot }} />{activeDiff.label}
                </span>
                <div className="absolute inset-x-3.5 bottom-3 text-white">
                  {location.trim() && <div className="mb-1 flex items-center gap-1 text-[11px] opacity-90"><MapPin size={11} />{location}</div>}
                  <h4 className="font-heading text-[19px] font-extrabold leading-tight text-white">{title.trim() || "Untitled trek"}</h4>
                </div>
              </div>
              <div className="p-4">
                <p className="min-h-[38px] text-[12.5px] leading-relaxed text-gray-500">{summary.trim() || "Add a one-line summary to describe this trek."}</p>
                <div className="mt-3 flex items-end justify-between border-t border-line/70 pt-3">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wide text-gray-400">From</div>
                    <div className="font-heading text-[20px] font-extrabold text-ink">₹{inr(basePrice)} <span className="text-xs font-medium text-gray-400">/ person</span></div>
                  </div>
                  <span className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white">{packages[0]?.cta_label || "Book Now"}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 rounded-xl border border-line bg-white p-1">
              <div className="px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-gray-400">Difficulty</div><div className="mt-0.5 font-mono text-[13px] font-semibold capitalize">{activeDiff.label}</div></div>
              <div className="px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-gray-400">Section</div><div className="mt-0.5 font-mono text-[13px] font-semibold capitalize">{group.replace("-", " ")}</div></div>
            </div>
            <p className="text-center text-[11px] leading-relaxed text-gray-400">Exactly how the trek appears on the public listing. Updates as you type.</p>
          </div>
        </aside>
      </div>
    </form>
  );
}
