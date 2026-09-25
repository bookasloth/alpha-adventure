"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTestimonial, updateTestimonial } from "./actions";

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-ink">{label}{hint && <span className="ml-1 font-normal text-gray-400">{hint}</span>}</span>
      {children}
    </label>
  );
}

export type TestimonialInitial = { id?: string; author_name: string; role: string; rating: string; body: string; avatar_url: string; status: string; position: string };
const EMPTY: TestimonialInitial = { author_name: "", role: "Alpha Adventures Trekker", rating: "5", body: "", avatar_url: "", status: "published", position: "0" };

export default function TestimonialForm({ mode, initial }: { mode: "new" | "edit"; initial?: TestimonialInitial }) {
  const router = useRouter();
  const init = initial ?? EMPTY;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState(init);
  const set = (k: keyof TestimonialInitial, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const payload = { author_name: f.author_name, role: f.role, rating: f.rating, body: f.body, avatar_url: f.avatar_url, status: f.status, position: f.position };
    try {
      const r = mode === "edit" ? await updateTestimonial(init.id!, payload) : await createTestimonial(payload);
      if (r.ok) router.push("/admin"); else { setError(r.error); setBusy(false); }
    } catch { setError("Something went wrong. Please try again."); setBusy(false); }
  }

  const heading = mode === "edit" ? "Edit testimonial" : "Add testimonial";
  const cta = mode === "edit" ? "Save changes" : "Save testimonial";
  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-gray-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
        <div><h1 className="text-2xl font-bold">{heading}</h1><p className="text-sm text-gray-500">Shown in the homepage testimonials slider.</p></div>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin")}>Cancel</Button>
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : cta}</Button>
        </div>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <Card>
        <CardHeader><CardTitle>Testimonial</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Author name"><input className={inp} value={f.author_name} onChange={(e) => set("author_name", e.target.value)} placeholder="Pratik Shah" /></Field>
            <Field label="Role"><input className={inp} value={f.role} onChange={(e) => set("role", e.target.value)} placeholder="Alpha Adventures Trekker" /></Field>
          </div>
          <Field label="Testimonial text"><textarea className={`${inp} min-h-28`} value={f.body} onChange={(e) => set("body", e.target.value)} /></Field>
          <Field label="Avatar URL" hint="(optional)"><input className={inp} value={f.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} placeholder="/assets/img/home1/testimonial-author-img1.png" /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Rating"><select className={inp} value={f.rating} onChange={(e) => set("rating", e.target.value)}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select></Field>
            <Field label="Status"><select className={inp} value={f.status} onChange={(e) => set("status", e.target.value)}><option value="published">Published</option><option value="draft">Draft</option></select></Field>
            <Field label="Position" hint="(order)"><input type="number" min={0} className={inp} value={f.position} onChange={(e) => set("position", e.target.value)} /></Field>
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
