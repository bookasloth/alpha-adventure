"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTour } from "./actions";

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}{hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}</span>
      {children}
    </label>
  );
}

export default function NewTourForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [type, setType] = useState("Domestic");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState("draft");

  const onTitle = (v: string) => { setTitle(v); if (!slugEdited) setSlug(slugify(v)); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await createTour({ title, slug, type, duration, base_price: price, image, description, featured, status });
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
        <div><h1 className="text-2xl font-bold">Add tour</h1><p className="text-sm text-gray-500">Creates a Supabase-backed tour, live at /tour-packages/&lt;slug&gt;.</p></div>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin")}>Cancel</Button>
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save tour"}</Button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Tour details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title"><input className={inp} value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Royal Rajasthan Heritage" /></Field>
            <Field label="Slug" hint="(URL)"><input className={inp} value={slug} onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} placeholder="royal-rajasthan-heritage" /></Field>
          </div>
          <Field label="Description"><textarea className={`${inp} min-h-24`} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Field label="Image URL"><input className={inp} value={image} onChange={(e) => setImage(e.target.value)} placeholder="/assets/img/home1/tour-package-img1.jpg" /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type"><select className={inp} value={type} onChange={(e) => setType(e.target.value)}><option value="Domestic">Domestic</option><option value="International">International</option></select></Field>
            <Field label="Duration" hint='(e.g. 6D/5N)'><input className={inp} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="6D/5N" /></Field>
            <Field label="Price" hint="(₹)"><input type="number" min={0} className={inp} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="18500" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Status"><select className={inp} value={status} onChange={(e) => setStatus(e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
            <label className="flex items-end gap-2 pb-2.5 text-sm"><input type="checkbox" className="accent-primary" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin")}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save tour"}</Button>
      </div>
    </form>
  );
}
