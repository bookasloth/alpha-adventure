"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTrek } from "./actions";

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

type Pkg = { name: string; price: string; inclusions: string; cta_label: string };
type Dep = { start_date: string; end_date: string; start_time: string; capacity: string; price_override: string; status: string };
const DEP_STATUS = ["open", "scheduled", "full", "closed", "cancelled", "completed"];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}{hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}</span>
      {children}
    </label>
  );
}

// Simple string-list repeater (inclusions / exclusions).
function ListRepeater({ items, setItems, placeholder }: { items: string[]; setItems: (v: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input className={inp} value={v} placeholder={placeholder}
            onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, ""])}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Plus size={15} /> Add row</button>
    </div>
  );
}

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

  const [inclusions, setInclusions] = useState<string[]>([""]);
  const [exclusions, setExclusions] = useState<string[]>([""]);
  const [packages, setPackages] = useState<Pkg[]>([{ name: "Standard Batch", price: "", inclusions: "", cta_label: "Book Now" }]);
  const [departures, setDepartures] = useState<Dep[]>([{ start_date: "", end_date: "", start_time: "", capacity: "30", price_override: "", status: "open" }]);

  const onTitle = (v: string) => { setTitle(v); if (!slugEdited) setSlug(slugify(v)); };

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

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-gray-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
        <div><h1 className="text-2xl font-bold">Add trek</h1><p className="text-sm text-gray-500">Creates a Supabase-backed trek, live at /treks/&lt;slug&gt;.</p></div>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin")}>Cancel</Button>
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save trek"}</Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title"><input className={inp} value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Harishchandragad Trek" /></Field>
            <Field label="Slug" hint="(URL)"><input className={inp} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} placeholder="harishchandragad-trek" /></Field>
          </div>
          <Field label="Summary" hint="(short, for cards)"><input className={inp} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A weekend night trek to the Konkan Kada cliff." /></Field>
          <Field label="Overview" hint="(long description)"><textarea className={`${inp} min-h-28`} value={overview} onChange={(e) => setOverview(e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hero image URL"><input className={inp} value={heroImage} onChange={(e) => setHeroImage(e.target.value)} placeholder="/assets/img/home2/trek-....jpg" /></Field>
            <Field label="Base price" hint="(₹)"><input type="number" min={0} className={inp} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="1299" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Difficulty"><select className={inp} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="beginner">Beginner</option><option value="moderate">Moderate</option><option value="difficult">Difficult</option></select></Field>
            <Field label="Status"><select className={inp} value={status} onChange={(e) => setStatus(e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
            <label className="flex items-end gap-2 pb-2.5 text-sm"><input type="checkbox" className="accent-primary" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Listing group" hint="(which section)"><select className={inp} value={group} onChange={(e) => setGroup(e.target.value)}><option value="sahyadri">Sahyadri</option><option value="himalayan">Himalayan</option><option value="central">Central India</option><option value="backpacking">Backpacking</option><option value="near-nagpur">Near Nagpur</option></select></Field>
            <Field label="Tags" hint="(comma-separated)"><input className={inp} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fort, moderate, night" /></Field>
            <Field label="Badge" hint="(optional)"><input className={inp} value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Adventure!" /></Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Facts <span className="text-sm font-normal text-gray-400">(optional)</span></CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Region"><input className={inp} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Sahyadri" /></Field>
          <Field label="Location"><input className={inp} value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
          <Field label="State"><input className={inp} value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" /></Field>
          <Field label="Duration" hint="(days)"><input type="number" min={0} className={inp} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="2" /></Field>
          <Field label="Altitude"><input className={inp} value={altitude} onChange={(e) => setAltitude(e.target.value)} placeholder="1424 m (4674 ft)" /></Field>
          <Field label="Base camp"><input className={inp} value={baseCamp} onChange={(e) => setBaseCamp(e.target.value)} placeholder="Khireshwar Village" /></Field>
          <Field label="Best season"><input className={inp} value={bestSeason} onChange={(e) => setBestSeason(e.target.value)} placeholder="June - February" /></Field>
          <Field label="Group size"><input className={inp} value={groupSize} onChange={(e) => setGroupSize(e.target.value)} placeholder="15 - 30 trekkers" /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inclusions & exclusions</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div><p className="mb-2 text-sm font-semibold text-ink">What's included</p><ListRepeater items={inclusions} setItems={setInclusions} placeholder="Return transport from Nagpur" /></div>
          <div><p className="mb-2 text-sm font-semibold text-ink">What's not included</p><ListRepeater items={exclusions} setItems={setExclusions} placeholder="Personal expenses & tips" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing packages</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {packages.map((p, i) => (
            <div key={i} className="rounded-xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Package {i + 1}</span>
                <button type="button" onClick={() => setPackages(packages.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Name"><input className={inp} value={p.name} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Standard Batch" /></Field>
                <Field label="Price" hint="(₹)"><input type="number" min={0} className={inp} value={p.price} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} placeholder="1299" /></Field>
                <Field label="Button label"><input className={inp} value={p.cta_label} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, cta_label: e.target.value } : x))} /></Field>
              </div>
              <div className="mt-3"><Field label="Inclusions" hint="(one per line or comma-separated)"><textarea className={`${inp} min-h-20`} value={p.inclusions} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, inclusions: e.target.value } : x))} placeholder={"Return transport\nTrek leaders & permits"} /></Field></div>
            </div>
          ))}
          <button type="button" onClick={() => setPackages([...packages, { name: "", price: "", inclusions: "", cta_label: "Book Now" }])}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Plus size={15} /> Add package</button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Dates <span className="text-sm font-normal text-gray-400">(departures / batches — each date books independently)</span></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {departures.map((d, i) => (
            <div key={i} className="rounded-xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Date {i + 1}</span>
                <button type="button" onClick={() => setDepartures(departures.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Start date"><input type="date" className={inp} value={d.start_date} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, start_date: e.target.value } : x))} /></Field>
                <Field label="End date" hint="(optional)"><input type="date" className={inp} value={d.end_date} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, end_date: e.target.value } : x))} /></Field>
                <Field label="Start time" hint="(optional)"><input className={inp} value={d.start_time} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, start_time: e.target.value } : x))} placeholder="10:00 PM" /></Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Capacity" hint="(seats)"><input type="number" min={1} className={inp} value={d.capacity} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, capacity: e.target.value } : x))} /></Field>
                <Field label="Price override" hint="(₹, blank = base)"><input type="number" min={0} className={inp} value={d.price_override} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, price_override: e.target.value } : x))} placeholder="base price" /></Field>
                <Field label="Status"><select className={inp} value={d.status} onChange={(e) => setDepartures(departures.map((x, j) => j === i ? { ...x, status: e.target.value } : x))}>{DEP_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setDepartures([...departures, { start_date: "", end_date: "", start_time: "", capacity: "30", price_override: "", status: "open" }])}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Plus size={15} /> Add date</button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin")}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save trek"}</Button>
      </div>
    </form>
  );
}
