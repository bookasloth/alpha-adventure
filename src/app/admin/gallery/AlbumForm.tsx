"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createGalleryAlbum, updateGalleryAlbum } from "./actions";

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

export type AlbumInitial = { slug: string; title: string; subtitle: string; hero: string; hero_alt: string; status: string };
const EMPTY: AlbumInitial = { slug: "", title: "", subtitle: "", hero: "", hero_alt: "", status: "draft" };

export default function AlbumForm({ mode, initial }: { mode: "new" | "edit"; initial?: AlbumInitial }) {
  const router = useRouter();
  const init = initial ?? EMPTY;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState(init);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const set = (k: keyof AlbumInitial, v: string) => setF((p) => ({ ...p, [k]: v }));
  const onTitle = (v: string) => setF((p) => ({ ...p, title: v, slug: slugEdited ? p.slug : slugify(v) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const payload = { slug: f.slug, title: f.title, subtitle: f.subtitle, hero: f.hero, hero_alt: f.hero_alt, status: f.status };
    try {
      const r = mode === "edit" ? await updateGalleryAlbum(init.slug, payload) : await createGalleryAlbum(payload);
      if (r.ok) router.push("/admin"); else { setError(r.error); setBusy(false); }
    } catch { setError("Something went wrong. Please try again."); setBusy(false); }
  }

  const heading = mode === "edit" ? "Edit album" : "Add album";
  const cta = mode === "edit" ? "Save changes" : "Save album";
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-gray-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
        <div><h1 className="text-2xl font-bold">{heading}</h1><p className="text-sm text-gray-500">Gallery album, live at /gallery/&lt;slug&gt;.</p></div>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin")}>Cancel</Button>
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : cta}</Button>
        </div>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <Card>
        <CardHeader><CardTitle>Album</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title"><input className={inp} value={f.title} onChange={(e) => onTitle(e.target.value)} placeholder="Harishchandragad Trek" /></Field>
            <Field label="Slug" hint={mode === "edit" ? "(fixed)" : "(URL)"}><input className={inp} value={f.slug} disabled={mode === "edit"} onChange={(e) => { set("slug", e.target.value); setSlugEdited(true); }} /></Field>
          </div>
          <Field label="Subtitle" hint="(optional)"><input className={inp} value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} /></Field>
          <Field label="Hero image URL"><input className={inp} value={f.hero} onChange={(e) => set("hero", e.target.value)} placeholder="/assets/img/innerpages/..." /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hero alt" hint="(optional)"><input className={inp} value={f.hero_alt} onChange={(e) => set("hero_alt", e.target.value)} /></Field>
            <Field label="Status"><select className={inp} value={f.status} onChange={(e) => set("status", e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin")}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : cta}</Button>
      </div>
    </form>
  );
}
