"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateTrek } from "./actions";

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

type Pkg = { name: string; price: string; inclusions: string; cta_label: string };
type Day = { title: string; description: string; image: string };

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}{hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}</span>
      {children}
    </label>
  );
}

function ListRepeater({ items, setItems, placeholder }: { items: string[]; setItems: (v: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input className={inp} value={v} placeholder={placeholder} onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...items, ""])} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Plus size={15} /> Add row</button>
    </div>
  );
}

export type TrekEditInitial = {
  slug: string; title: string; summary: string; overview: string; hero_image: string;
  price: string; difficulty: string; status: string; group: string; tags: string; badge: string;
  region: string; location: string; state: string; duration_days: string; altitude: string;
  base_camp: string; best_season: string; group_size: string; featured: boolean;
  inclusions: string[]; exclusions: string[]; packages: Pkg[]; itinerary: Day[];
};

export default function TrekEditForm({ initial }: { initial: TrekEditInitial }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState(initial);
  const set = (k: keyof TrekEditInitial, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const [inclusions, setInclusions] = useState<string[]>(initial.inclusions.length ? initial.inclusions : [""]);
  const [exclusions, setExclusions] = useState<string[]>(initial.exclusions.length ? initial.exclusions : [""]);
  const [packages, setPackages] = useState<Pkg[]>(initial.packages);
  const [itinerary, setItinerary] = useState<Day[]>(initial.itinerary);

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
      inclusions: list(inclusions),
      exclusions: list(exclusions),
      packages: packages.filter((p) => p.name.trim()).map((p) => ({
        name: p.name.trim(), price: p.price, inclusions: clean(p.inclusions), cta_label: p.cta_label.trim() || "Book Now",
      })),
      itinerary: itinerary.filter((d) => d.title.trim()).map((d) => ({
        title: d.title.trim(), description: d.description, image: d.image,
      })),
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

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-gray-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
        <div><h1 className="text-2xl font-bold">Edit trek</h1><p className="text-sm text-gray-500">{initial.slug} — itinerary, inclusions & dates are managed separately.</p></div>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin")}>Cancel</Button>
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Title"><input className={inp} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Summary"><input className={inp} value={f.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
          <Field label="Overview"><textarea className={`${inp} min-h-28`} value={f.overview} onChange={(e) => set("overview", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hero image URL"><input className={inp} value={f.hero_image} onChange={(e) => set("hero_image", e.target.value)} /></Field>
            <Field label="Base price" hint="(₹)"><input type="number" min={0} className={inp} value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Difficulty"><select className={inp} value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}><option value="beginner">Beginner</option><option value="moderate">Moderate</option><option value="difficult">Difficult</option></select></Field>
            <Field label="Status"><select className={inp} value={f.status} onChange={(e) => set("status", e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
            <label className="flex items-end gap-2 pb-2.5 text-sm"><input type="checkbox" className="accent-primary" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Listing group"><select className={inp} value={f.group} onChange={(e) => set("group", e.target.value)}><option value="sahyadri">Sahyadri</option><option value="himalayan">Himalayan</option><option value="central">Central India</option><option value="backpacking">Backpacking</option><option value="near-nagpur">Near Nagpur</option></select></Field>
            <Field label="Tags" hint="(comma-sep)"><input className={inp} value={f.tags} onChange={(e) => set("tags", e.target.value)} /></Field>
            <Field label="Badge"><input className={inp} value={f.badge} onChange={(e) => set("badge", e.target.value)} /></Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Facts <span className="text-sm font-normal text-gray-400">(optional)</span></CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Region"><input className={inp} value={f.region} onChange={(e) => set("region", e.target.value)} /></Field>
          <Field label="Location"><input className={inp} value={f.location} onChange={(e) => set("location", e.target.value)} /></Field>
          <Field label="State"><input className={inp} value={f.state} onChange={(e) => set("state", e.target.value)} /></Field>
          <Field label="Duration" hint="(days)"><input type="number" min={0} className={inp} value={f.duration_days} onChange={(e) => set("duration_days", e.target.value)} /></Field>
          <Field label="Altitude"><input className={inp} value={f.altitude} onChange={(e) => set("altitude", e.target.value)} /></Field>
          <Field label="Base camp"><input className={inp} value={f.base_camp} onChange={(e) => set("base_camp", e.target.value)} /></Field>
          <Field label="Best season"><input className={inp} value={f.best_season} onChange={(e) => set("best_season", e.target.value)} /></Field>
          <Field label="Group size"><input className={inp} value={f.group_size} onChange={(e) => set("group_size", e.target.value)} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Inclusions & exclusions</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div><p className="mb-2 text-sm font-semibold text-ink">What's included</p><ListRepeater items={inclusions} setItems={setInclusions} placeholder="Return transport" /></div>
          <div><p className="mb-2 text-sm font-semibold text-ink">What's not included</p><ListRepeater items={exclusions} setItems={setExclusions} placeholder="Personal expenses" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Itinerary <span className="text-sm font-normal text-gray-400">(day by day)</span></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {itinerary.map((d, i) => (
            <div key={i} className="rounded-xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold text-ink">Day {i + 1}</span>
                <button type="button" onClick={() => setItinerary(itinerary.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button></div>
              <div className="space-y-3">
                <Field label="Title"><input className={inp} value={d.title} onChange={(e) => setItinerary(itinerary.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Base to summit" /></Field>
                <Field label="Description"><textarea className={`${inp} min-h-20`} value={d.description} onChange={(e) => setItinerary(itinerary.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} /></Field>
                <Field label="Image URL" hint="(optional)"><input className={inp} value={d.image} onChange={(e) => setItinerary(itinerary.map((x, j) => j === i ? { ...x, image: e.target.value } : x))} placeholder="/assets/img/..." /></Field>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setItinerary([...itinerary, { title: "", description: "", image: "" }])} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Plus size={15} /> Add day</button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing packages</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {packages.map((p, i) => (
            <div key={i} className="rounded-xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold text-ink">Package {i + 1}</span>
                <button type="button" onClick={() => setPackages(packages.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-600"><Trash2 size={15} /></button></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Name"><input className={inp} value={p.name} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></Field>
                <Field label="Price" hint="(₹)"><input type="number" min={0} className={inp} value={p.price} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} /></Field>
                <Field label="Button label"><input className={inp} value={p.cta_label} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, cta_label: e.target.value } : x))} /></Field>
              </div>
              <div className="mt-3"><Field label="Inclusions" hint="(one per line or comma)"><textarea className={`${inp} min-h-20`} value={p.inclusions} onChange={(e) => setPackages(packages.map((x, j) => j === i ? { ...x, inclusions: e.target.value } : x))} /></Field></div>
            </div>
          ))}
          <button type="button" onClick={() => setPackages([...packages, { name: "", price: "", inclusions: "", cta_label: "Book Now" }])} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><Plus size={15} /> Add package</button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin")}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
      </div>
    </form>
  );
}
