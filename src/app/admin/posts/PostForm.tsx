"use client";

import { revealOnMount } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPost, updatePost } from "./actions";

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

export type PostInitial = {
  slug: string; title: string; excerpt: string; body: string; status: string;
  trek_id: string; seo_title: string; meta_description: string;
};
const EMPTY: PostInitial = { slug: "", title: "", excerpt: "", body: "", status: "draft", trek_id: "", seo_title: "", meta_description: "" };

export default function PostForm({
  mode, initial, trekOptions,
}: {
  mode: "new" | "edit";
  initial?: PostInitial;
  trekOptions: { id: string; title: string }[];
}) {
  const router = useRouter();
  const init = initial ?? EMPTY;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(init.title);
  const [slug, setSlug] = useState(init.slug);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(init.excerpt);
  const [body, setBody] = useState(init.body);
  const [status, setStatus] = useState(init.status);
  const [trekId, setTrekId] = useState(init.trek_id);
  const [seoTitle, setSeoTitle] = useState(init.seo_title);
  const [metaDescription, setMetaDescription] = useState(init.meta_description);

  const onTitle = (v: string) => { setTitle(v); if (!slugEdited) setSlug(slugify(v)); };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = { title, slug, excerpt, body, status, trek_id: trekId, seo_title: seoTitle, meta_description: metaDescription };
    try {
      const r = mode === "edit" ? await updatePost(init.slug, payload) : await createPost(payload);
      if (r.ok) router.push("/admin");
      else { setError(r.error); setBusy(false); }
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const heading = mode === "edit" ? "Edit post" : "Add post";
  const cta = mode === "edit" ? "Save changes" : "Save post";

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-gray-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
        <div><h1 className="text-2xl font-bold">{heading}</h1><p className="text-sm text-gray-500">Supabase-backed blog post, live at /blog/&lt;slug&gt;.</p></div>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin")}>Cancel</Button>
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : cta}</Button>
        </div>
      </div>

      {error && <div ref={revealOnMount} role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Post</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title"><input className={inp} value={title} onChange={(e) => onTitle(e.target.value)} placeholder="A weekend on Harishchandragad" /></Field>
            <Field label="Slug" hint={mode === "edit" ? "(fixed)" : "(URL)"}><input className={inp} value={slug} disabled={mode === "edit"} onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} placeholder="weekend-on-harishchandragad" /></Field>
          </div>
          <Field label="Excerpt" hint="(short teaser, optional)"><textarea className={`${inp} min-h-20`} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} /></Field>
          <Field label="Body"><textarea className={`${inp} min-h-64`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write the story…" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status"><select className={inp} value={status} onChange={(e) => setStatus(e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></Field>
            <Field label="Linked trek" hint="(optional)">
              <select className={inp} value={trekId} onChange={(e) => setTrekId(e.target.value)}>
                <option value="">— None —</option>
                {trekOptions.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO <span className="text-sm font-normal text-gray-400">(optional)</span></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="SEO title" hint="(defaults to the post title)"><input className={inp} value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} /></Field>
          <Field label="Meta description"><textarea className={`${inp} min-h-20`} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} /></Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push("/admin")}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : cta}</Button>
      </div>
    </form>
  );
}
