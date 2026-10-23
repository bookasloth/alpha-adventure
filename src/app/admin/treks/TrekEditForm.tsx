"use client";

import { revealOnMount } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Check, Sparkles, Compass, Star,
  ListChecks, Footprints, Package, HelpCircle, Images, MapPin, Bus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTrek } from "./actions";
import ImageField from "@/app/admin/ImageField";
import BoardingEditor, { boardingPayload, type BoardingRow } from "./BoardingEditor";

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";
const inr = (v: string) => (v && Number(v) > 0 ? Number(v).toLocaleString("en-IN") : "—");

type Pkg = { name: string; price: string; inclusions: string; cta_label: string };
type Faq = { question: string; answer: string };
type GalleryImg = { image_url: string; caption: string };
type Day = {
  title: string; description: string; image: string;
  // Per-day metrics surfaced on the public detail page (migration 0027).
  trek_distance: string; trek_duration: string;
  drive_distance: string; drive_duration: string;
  altitude_gain: string; altitude_loss: string; meals: string;
};
// A fresh itinerary day with every field blank.
const blankDay = (): Day => ({
  title: "", description: "", image: "",
  trek_distance: "", trek_duration: "", drive_distance: "", drive_duration: "",
  altitude_gain: "", altitude_loss: "", meals: "",
});
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

function ListRepeater({ items, setItems, placeholder, addLabel = "Add row" }: { items: string[]; setItems: (v: string[]) => void; placeholder: string; addLabel?: string }) {
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input className={inp} value={v} placeholder={placeholder} onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-gray-400 transition hover:border-red-200 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, ""])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"><Plus size={15} /> {addLabel}</button>
    </div>
  );
}

// A form section with an icon header; `id` anchors the rail.
function SectionCard({ id, icon, title, optional, children }: {
  id: string; icon: React.ReactNode; title: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[90px] rounded-2xl border border-line bg-white shadow-soft">
      <div className="flex items-center gap-2.5 border-b border-line/70 px-5 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-primary/10 text-primary">{icon}</span>
        <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
        {optional && <span className="text-[11px] font-medium text-gray-400">optional</span>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const SECTIONS = [
  { id: "s-basics", label: "Essentials" },
  { id: "s-facts", label: "Trek facts" },
  { id: "s-highlights", label: "Highlights" },
  { id: "s-incl", label: "Inclusions" },
  { id: "s-itin", label: "Itinerary" },
  { id: "s-pkg", label: "Packages" },
  { id: "s-boarding", label: "Boarding" },
  { id: "s-faq", label: "FAQs" },
  { id: "s-gallery", label: "Gallery" },
];

export type TrekEditInitial = {
  slug: string; title: string; summary: string; overview: string; hero_image: string;
  price: string; difficulty: string; status: string; group: string; tags: string; badge: string;
  region: string; location: string; state: string; duration_days: string; altitude: string;
  base_camp: string; best_season: string; group_size: string; featured: boolean;
  // Trek-detail extras shown on the public page (migration 0027).
  brochure_url: string; suitable_age: string; accommodation: string; fitness_criteria: string;
  not_to_miss: string[];
  inclusions: string[]; exclusions: string[]; packages: Pkg[]; itinerary: Day[]; faqs: Faq[]; gallery: GalleryImg[];
  // Boarding locations (migration 0029), max 4.
  boarding: BoardingRow[]; boarding_disclaimer: string;
};

export default function TrekEditForm({ initial }: { initial: TrekEditInitial }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState(initial);
  const set = (k: keyof TrekEditInitial, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const [inclusions, setInclusions] = useState<string[]>(initial.inclusions.length ? initial.inclusions : [""]);
  const [exclusions, setExclusions] = useState<string[]>(initial.exclusions.length ? initial.exclusions : [""]);
  const [notToMiss, setNotToMiss] = useState<string[]>(initial.not_to_miss.length ? initial.not_to_miss : [""]);
  const [packages, setPackages] = useState<Pkg[]>(initial.packages);
  const [itinerary, setItinerary] = useState<Day[]>(initial.itinerary);
  const [faqs, setFaqs] = useState<Faq[]>(initial.faqs);
  const [gallery, setGallery] = useState<GalleryImg[]>(initial.gallery);
  const [boarding, setBoarding] = useState<BoardingRow[]>(initial.boarding);
  const [boardingDisclaimer, setBoardingDisclaimer] = useState(initial.boarding_disclaimer);
  const setDay = (i: number, key: keyof Day, v: string) =>
    setItinerary((prev) => prev.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
  const setFaq = (i: number, key: keyof Faq, v: string) =>
    setFaqs((prev) => prev.map((x, j) => (j === i ? { ...x, [key]: v } : x)));
  const setGal = (i: number, key: keyof GalleryImg, v: string) =>
    setGallery((prev) => prev.map((x, j) => (j === i ? { ...x, [key]: v } : x)));

  // ── Completion: which of the 6 essentials are filled (drives the ring). ──
  const essentials = useMemo(() => [
    !!f.title.trim(), !!f.summary.trim(), !!f.hero_image.trim(),
    Number(f.price) > 0, !!f.difficulty, !!f.group,
  ], [f.title, f.summary, f.hero_image, f.price, f.difficulty, f.group]);
  const doneCount = essentials.filter(Boolean).length;
  const pct = Math.round((doneCount / essentials.length) * 100);
  const sectionDone: Record<string, boolean> = {
    "s-basics": essentials.every(Boolean),
    "s-highlights": notToMiss.some((x) => x.trim()) || !!f.brochure_url.trim(),
    "s-incl": inclusions.some((x) => x.trim()) || exclusions.some((x) => x.trim()),
    "s-itin": itinerary.some((d) => d.title.trim()),
    "s-pkg": packages.some((p) => p.name.trim()),
    "s-boarding": boarding.some((b) => b.name.trim()),
    "s-faq": faqs.some((q) => q.question.trim() && q.answer.trim()),
    "s-gallery": gallery.some((g) => g.image_url.trim()),
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
    const clean = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
    const list = (a: string[]) => a.map((x) => x.trim()).filter(Boolean);
    const payload = {
      title: f.title, summary: f.summary, overview: f.overview, hero_image: f.hero_image,
      base_price: f.price, difficulty: f.difficulty, status: f.status,
      group: f.group, tags: clean(f.tags), badge: f.badge,
      region: f.region, location: f.location, state: f.state,
      duration_days: f.duration_days || undefined,
      altitude: f.altitude, base_camp: f.base_camp, best_season: f.best_season, group_size: f.group_size,
      featured: f.featured,
      brochure_url: f.brochure_url, suitable_age: f.suitable_age,
      accommodation: f.accommodation, fitness_criteria: f.fitness_criteria,
      not_to_miss: list(notToMiss),
      inclusions: list(inclusions),
      exclusions: list(exclusions),
      packages: packages.filter((p) => p.name.trim()).map((p) => ({
        name: p.name.trim(), price: p.price, inclusions: clean(p.inclusions), cta_label: p.cta_label.trim() || "Book Now",
      })),
      itinerary: itinerary.filter((d) => d.title.trim()).map((d) => ({
        title: d.title.trim(), description: d.description, image: d.image,
        trek_distance: d.trek_distance, trek_duration: d.trek_duration,
        drive_distance: d.drive_distance, drive_duration: d.drive_duration,
        altitude_gain: d.altitude_gain, altitude_loss: d.altitude_loss, meals: d.meals,
      })),
      // Both columns are NOT NULL — keep only rows with a question AND an answer.
      faqs: faqs.filter((q) => q.question.trim() && q.answer.trim()).map((q) => ({
        question: q.question.trim(), answer: q.answer.trim(),
      })),
      // image_url is NOT NULL — drop rows without an image; caption is optional.
      gallery: gallery.filter((g) => g.image_url.trim()).map((g) => ({
        image_url: g.image_url.trim(), caption: g.caption.trim(),
      })),
      boarding: boardingPayload(boarding),
      boarding_disclaimer: boardingDisclaimer,
    };
    try {
      const r = await updateTrek(initial.slug, payload);
      if (r.ok) router.push("/admin");
      else { setError(r.error); setBusy(false); }
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const activeDiff = DIFF.find((d) => d.v === f.difficulty) ?? DIFF[1];

  return (
    <form onSubmit={submit}>
      {/* ── Sticky action bar ── */}
      <div className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/admin" aria-label="Back to admin" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-gray-500 transition hover:bg-slate-100 hover:text-ink"><ArrowLeft size={18} /></Link>
          <div className="min-w-0">
            <div className="text-[15px] font-bold leading-tight text-ink">Edit trek</div>
            <div className="hidden items-center gap-1.5 text-[11.5px] text-gray-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> live at <span className="font-medium text-gray-500">/treks/{initial.slug}</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden rounded-full border border-line bg-slate-50 p-0.5 sm:inline-flex" role="group" aria-label="Status">
              {(["draft", "published"] as const).map((v) => (
                <button key={v} type="button" onClick={() => set("status", v)} aria-pressed={f.status === v}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${f.status === v ? (v === "published" ? "bg-white text-green-600 shadow-soft" : "bg-white text-ink shadow-soft") : "text-gray-400 hover:text-ink"}`}>{v}</button>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin")}>Cancel</Button>
            <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
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
                  <h3 className="text-[13px] font-bold tracking-tight text-ink">{pct === 100 ? "Looks complete" : "Needs detail"}</h3>
                  <p className="mt-0.5 text-[11.5px] text-gray-400">{doneCount} of {essentials.length} essentials filled</p>
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
                </button>
              ))}
            </nav>
            <p className="px-1 text-[11.5px] leading-relaxed text-gray-400"><span className="font-semibold text-gray-500">Tip.</span> Dates / batches are managed separately in the Departures tab.</p>
          </div>
        </aside>

        {/* ── Center: form ── */}
        <main className="flex min-w-0 flex-col gap-5">
          {error && <div ref={revealOnMount} role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <SectionCard id="s-basics" icon={<Sparkles size={16} />} title="Essentials">
            <div className="space-y-4">
              <Field label="Trek name" required><input className={inp} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
              <Field label="Card summary" required><input className={inp} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
              <Field label="Overview" hint="· full description"><textarea className={`${inp} min-h-28`} value={f.overview} onChange={(e) => set("overview", e.target.value)} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hero image" required><ImageField className={inp} value={f.hero_image} onChange={(v) => set("hero_image", v)} folder="treks" placeholder="/assets/img/... or upload" /></Field>
                <Field label="Base price" required>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 font-mono text-sm text-gray-400">₹</span>
                    <input type="number" min={0} className={`${inp} pl-7`} value={f.price} onChange={(e) => set("price", e.target.value)} />
                  </div>
                </Field>
              </div>
              <div>
                <span className="mb-2 block text-xs font-semibold text-ink">Difficulty <span className="text-primary">*</span></span>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty">
                  {DIFF.map((d) => (
                    <button key={d.v} type="button" onClick={() => set("difficulty", d.v)} aria-pressed={f.difficulty === d.v}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${f.difficulty === d.v ? "border-primary bg-primary text-white" : "border-line bg-slate-50 text-gray-500 hover:border-gray-300"}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: f.difficulty === d.v ? "#fff" : d.dot }} />{d.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Listing section" required><select className={inp} value={f.group} onChange={(e) => set("group", e.target.value)}><option value="sahyadri">Sahyadri</option><option value="himalayan">Himalayan</option><option value="central">Central India</option><option value="backpacking">Backpacking</option><option value="near-nagpur">Near Nagpur</option></select></Field>
                <Field label="Tags" hint="· comma"><input className={inp} value={f.tags} onChange={(e) => set("tags", e.target.value)} /></Field>
                <Field label="Badge" hint="· optional"><input className={inp} value={f.badge} onChange={(e) => set("badge", e.target.value)} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" className="h-4 w-4 accent-primary" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Feature on the homepage</label>
            </div>
          </SectionCard>

          <SectionCard id="s-facts" icon={<Compass size={16} />} title="Trek facts" optional>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Region"><input className={inp} value={f.region} onChange={(e) => set("region", e.target.value)} /></Field>
              <Field label="Location"><input className={inp} value={f.location} onChange={(e) => set("location", e.target.value)} /></Field>
              <Field label="State"><input className={inp} value={f.state} onChange={(e) => set("state", e.target.value)} /></Field>
              <Field label="Duration" hint="· days"><input type="number" min={0} className={inp} value={f.duration_days} onChange={(e) => set("duration_days", e.target.value)} /></Field>
              <Field label="Altitude"><input className={inp} value={f.altitude} onChange={(e) => set("altitude", e.target.value)} /></Field>
              <Field label="Base camp"><input className={inp} value={f.base_camp} onChange={(e) => set("base_camp", e.target.value)} /></Field>
              <Field label="Best season"><input className={inp} value={f.best_season} onChange={(e) => set("best_season", e.target.value)} /></Field>
              <Field label="Group size"><input className={inp} value={f.group_size} onChange={(e) => set("group_size", e.target.value)} /></Field>
              <Field label="Suitable age"><input className={inp} value={f.suitable_age} onChange={(e) => set("suitable_age", e.target.value)} placeholder="15 – 55 years" /></Field>
              <Field label="Accommodation"><input className={inp} value={f.accommodation} onChange={(e) => set("accommodation", e.target.value)} placeholder="Tent / cave stay" /></Field>
              <div className="sm:col-span-2"><Field label="Fitness criteria"><input className={inp} value={f.fitness_criteria} onChange={(e) => set("fitness_criteria", e.target.value)} placeholder="Able to walk 8–10 km with a light backpack" /></Field></div>
            </div>
          </SectionCard>

          <SectionCard id="s-highlights" icon={<Star size={16} />} title="Highlights & brochure" optional>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-ink">Not to miss</p>
                <ListRepeater items={notToMiss} setItems={setNotToMiss} placeholder="Konkan Kada cliff at sunrise" addLabel="Add highlight" />
              </div>
              <Field label="Brochure / itinerary PDF" hint="· URL"><input className={inp} value={f.brochure_url} onChange={(e) => set("brochure_url", e.target.value)} placeholder="https://… .pdf" /></Field>
            </div>
          </SectionCard>

          <SectionCard id="s-incl" icon={<ListChecks size={16} />} title="Inclusions & exclusions">
            <div className="grid gap-6 sm:grid-cols-2">
              <div><p className="mb-2 text-xs font-semibold text-green-600">✓ What&apos;s included</p><ListRepeater items={inclusions} setItems={setInclusions} placeholder="Return transport" addLabel="Add" /></div>
              <div><p className="mb-2 text-xs font-semibold text-amber-600">✕ What&apos;s not included</p><ListRepeater items={exclusions} setItems={setExclusions} placeholder="Personal expenses" addLabel="Add" /></div>
            </div>
          </SectionCard>

          <SectionCard id="s-itin" icon={<Footprints size={16} />} title="Itinerary" optional>
            <div className="space-y-4">
              <p className="-mt-1 text-[11.5px] text-gray-400">Day by day — shown on the public trek page.</p>
              {itinerary.map((d, i) => (
                <div key={i} className="rounded-xl border border-line bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-ink">Day {i + 1}</span>
                    <button type="button" onClick={() => setItinerary(itinerary.filter((_, j) => j !== i))} className="text-gray-400 transition hover:text-red-600"><Trash2 size={15} /></button></div>
                  <div className="space-y-3">
                    <Field label="Title"><input className={inp} value={d.title} onChange={(e) => setItinerary(itinerary.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Base to summit" /></Field>
                    <Field label="Description"><textarea className={`${inp} min-h-20`} value={d.description} onChange={(e) => setItinerary(itinerary.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} /></Field>
                    <Field label="Image" hint="· optional"><ImageField className={inp} value={d.image} onChange={(v) => setItinerary(itinerary.map((x, j) => j === i ? { ...x, image: v } : x))} folder="treks/itinerary" placeholder="/assets/img/... or upload" /></Field>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Trek distance"><input className={inp} value={d.trek_distance} onChange={(e) => setDay(i, "trek_distance", e.target.value)} placeholder="6 km" /></Field>
                      <Field label="Trek duration"><input className={inp} value={d.trek_duration} onChange={(e) => setDay(i, "trek_duration", e.target.value)} placeholder="4–5 hrs" /></Field>
                      <Field label="Drive distance"><input className={inp} value={d.drive_distance} onChange={(e) => setDay(i, "drive_distance", e.target.value)} placeholder="180 km" /></Field>
                      <Field label="Drive duration"><input className={inp} value={d.drive_duration} onChange={(e) => setDay(i, "drive_duration", e.target.value)} placeholder="5 hrs" /></Field>
                      <Field label="Altitude gain"><input className={inp} value={d.altitude_gain} onChange={(e) => setDay(i, "altitude_gain", e.target.value)} placeholder="900 m" /></Field>
                      <Field label="Altitude loss"><input className={inp} value={d.altitude_loss} onChange={(e) => setDay(i, "altitude_loss", e.target.value)} placeholder="0 m" /></Field>
                      <div className="sm:col-span-2"><Field label="Meals"><input className={inp} value={d.meals} onChange={(e) => setDay(i, "meals", e.target.value)} placeholder="Dinner + Breakfast" /></Field></div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setItinerary([...itinerary, blankDay()])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"><Plus size={15} /> Add day</button>
            </div>
          </SectionCard>

          <SectionCard id="s-pkg" icon={<Package size={16} />} title="Pricing packages">
            <div className="space-y-4">
              {packages.map((p, i) => (
                <div key={i} className="rounded-xl border border-line bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-ink">Package {i + 1}</span>
                    <button type="button" onClick={() => setPackages(packages.filter((_, j) => j !== i))} className="text-gray-400 transition hover:text-red-600"><Trash2 size={15} /></button></div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Name"><input className={inp} value={p.name} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></Field>
                    <Field label="Price" hint="· ₹"><input type="number" min={0} className={inp} value={p.price} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} /></Field>
                    <Field label="Button label"><input className={inp} value={p.cta_label} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, cta_label: e.target.value } : x))} /></Field>
                  </div>
                  <div className="mt-3"><Field label="Inclusions" hint="· one per line or comma"><textarea className={`${inp} min-h-20`} value={p.inclusions} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, inclusions: e.target.value } : x))} /></Field></div>
                </div>
              ))}
              <button type="button" onClick={() => setPackages([...packages, { name: "", price: "", inclusions: "", cta_label: "Book Now" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"><Plus size={15} /> Add package</button>
            </div>
          </SectionCard>

          <SectionCard id="s-boarding" icon={<Bus size={16} />} title="Boarding locations" optional>
            <BoardingEditor rows={boarding} setRows={setBoarding} disclaimer={boardingDisclaimer} setDisclaimer={setBoardingDisclaimer} />
          </SectionCard>

          <SectionCard id="s-faq" icon={<HelpCircle size={16} />} title="FAQs" optional>
            <div className="space-y-4">
              <p className="-mt-1 text-[11.5px] text-gray-400">Shown on the trek page.</p>
              {faqs.map((q, i) => (
                <div key={i} className="rounded-xl border border-line bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-ink">FAQ {i + 1}</span>
                    <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} className="text-gray-400 transition hover:text-red-600"><Trash2 size={15} /></button></div>
                  <div className="space-y-3">
                    <Field label="Question"><input className={inp} value={q.question} onChange={(e) => setFaq(i, "question", e.target.value)} placeholder="What should I pack?" /></Field>
                    <Field label="Answer"><textarea className={`${inp} min-h-20`} value={q.answer} onChange={(e) => setFaq(i, "answer", e.target.value)} /></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"><Plus size={15} /> Add FAQ</button>
            </div>
          </SectionCard>

          <SectionCard id="s-gallery" icon={<Images size={16} />} title="Photo gallery" optional>
            <div className="space-y-4">
              <p className="-mt-1 text-[11.5px] text-gray-400">Shown on the trek page.</p>
              {gallery.map((g, i) => (
                <div key={i} className="rounded-xl border border-line bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-ink">Photo {i + 1}</span>
                    <button type="button" onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="text-gray-400 transition hover:text-red-600"><Trash2 size={15} /></button></div>
                  <div className="space-y-3">
                    <Field label="Image"><ImageField className={inp} value={g.image_url} onChange={(v) => setGal(i, "image_url", v)} folder="treks/gallery" placeholder="/assets/img/... or upload" /></Field>
                    <Field label="Caption" hint="· optional"><input className={inp} value={g.caption} onChange={(e) => setGal(i, "caption", e.target.value)} placeholder="Sunrise from Konkan Kada" /></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setGallery([...gallery, { image_url: "", caption: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"><Plus size={15} /> Add photo</button>
            </div>
          </SectionCard>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => router.push("/admin")}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
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
                style={f.hero_image ? { backgroundImage: `url(${f.hero_image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {!f.hero_image && <div className="absolute inset-0 grid place-items-center text-xs text-gray-400">Hero image</div>}
                {f.badge.trim() && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-wide text-ink">{f.badge}</span>}
                <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10.5px] font-semibold text-white backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: activeDiff.dot }} />{activeDiff.label}
                </span>
                <div className="absolute inset-x-3.5 bottom-3 text-white">
                  {f.location.trim() && <div className="mb-1 flex items-center gap-1 text-[11px] opacity-90"><MapPin size={11} />{f.location}</div>}
                  <h4 className="font-heading text-[19px] font-extrabold leading-tight text-white">{f.title.trim() || "Untitled trek"}</h4>
                </div>
              </div>
              <div className="p-4">
                <p className="min-h-[38px] text-[12.5px] leading-relaxed text-gray-500">{f.summary.trim() || "Add a one-line summary to describe this trek."}</p>
                <div className="mt-3 flex items-end justify-between border-t border-line/70 pt-3">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wide text-gray-400">From</div>
                    <div className="font-heading text-[20px] font-extrabold text-ink">₹{inr(f.price)} <span className="text-xs font-medium text-gray-400">/ person</span></div>
                  </div>
                  <span className="rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white">{packages[0]?.cta_label || "Book Now"}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 rounded-xl border border-line bg-white p-1">
              <div className="px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-gray-400">Difficulty</div><div className="mt-0.5 font-mono text-[13px] font-semibold capitalize">{activeDiff.label}</div></div>
              <div className="px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-gray-400">Section</div><div className="mt-0.5 font-mono text-[13px] font-semibold capitalize">{f.group.replace("-", " ")}</div></div>
            </div>
            <p className="text-center text-[11px] leading-relaxed text-gray-400">Exactly how the trek appears on the public listing. Updates as you type.</p>
          </div>
        </aside>
      </div>
    </form>
  );
}
