"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateTrek } from "./actions";

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}{hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}</span>
      {children}
    </label>
  );
}

export type TrekEditInitial = {
  slug: string; title: string; summary: string; overview: string; hero_image: string;
  price: string; difficulty: string; status: string; group: string; tags: string; badge: string;
  region: string; location: string; state: string; duration_days: string; altitude: string;
  base_camp: string; best_season: string; group_size: string; featured: boolean;
};

export default function TrekEditForm({ initial }: { initial: TrekEditInitial }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState(initial);
  const set = (k: keyof TrekEditInitial, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const clean = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
    const payload = {
      title: f.title, summary: f.summary, overview: f.overview, hero_image: f.hero_image,
      base_price: f.price, difficulty: f.difficulty, status: f.status,
      group: f.group, tags: clean(f.tags), badge: f.badge,
      region: f.region, location: f.location, state: f.state,
      duration_days: f.duration_days || undefined,
      altitude: f.altitude, base_camp: f.base_camp, best_season: f.best_season, group_size: f.group_size,
      featured: f.featured,
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin")}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
      </div>
    </form>
  );
}
