"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { gallery as siteGallery } from "@/data/gallery";

export type GalleryImage = {
  id: string;
  src: string;
  title: string;
  category: string;
  alt?: string;
  date?: string;
  local?: boolean;
};

export const CATEGORIES = ["Trek Photos", "Tour Photos", "Monsoon", "Winter", "Team & Corporate"];

const badgeFor = (cat: string) => ({
  "Trek Photos": "success", "Tour Photos": "brand", Monsoon: "warning", Winter: "neutral", "Team & Corporate": "danger",
} as const)[cat] ?? "neutral";

// Seed the admin grid with the images already shown on the live gallery page
// (they hot-link from the CDN, so they're all accessible in the browser).
export const seedGallery = (): GalleryImage[] =>
  siteGallery.map((g, i) => ({
    id: "site-" + (i + 1),
    src: g.thumb,
    title: ["Kalsubai sunrise", "Valley of Flowers", "Monsoon waterfall", "Campfire stories", "Sahyadri panorama", "Trail check-in"][i],
    category: CATEGORIES[i % CATEGORIES.length],
    alt: "Alpha Adventures gallery photo",
  }));

const genId = () => "gal-" + Math.random().toString(36).slice(2, 10);
const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });

export default function GalleryPage({ items, setItems, notify }: {
  items: GalleryImage[];
  setItems: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
  notify: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  const filtered = items.filter((it) =>
    (cat === "all" || it.category === cat) &&
    (!q.trim() || `${it.title} ${it.alt ?? ""} ${it.category}`.toLowerCase().includes(q.trim().toLowerCase())),
  );

  const remove = (it: GalleryImage) => {
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    notify(`"${it.title}" removed from gallery`);
  };

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">Photos shown on the site — add images straight from your browser.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}><ImagePlus size={16} /> Add image</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
          {["all", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium", cat === c ? "bg-primary text-white" : "text-gray-500 hover:text-ink")}>
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search gallery…"
            className="w-56 rounded-lg border border-line bg-white py-2 pl-3 pr-3 text-sm text-ink outline-none focus:border-primary" />
        </div>
      </div>

      <Card>
        <CardContent className="p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-gray-400"><ImagePlus size={24} /></div>
              <p className="text-gray-500">No images match. Add a photo from your browser to get started.</p>
              <Button size="sm" onClick={() => setOpen(true)}>Add image</Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((it) => (
                <div key={it.id} className="group relative overflow-hidden rounded-xl border border-line bg-white">
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    <img src={it.src} alt={it.alt ?? it.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <button onClick={() => remove(it)} aria-label={`Remove ${it.title}`} title="Remove"
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600">
                      <Trash2 size={15} />
                    </button>
                    {it.local && <Badge variant="brand" className="absolute left-2 top-2">Uploaded</Badge>}
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate text-sm font-semibold text-ink" title={it.title}>{it.title}</div>
                      <Badge variant={badgeFor(it.category)}>{it.category}</Badge>
                    </div>
                    {it.date && <div className="text-xs text-gray-400">Added {it.date}</div>}
                    {it.alt && <div className="truncate text-xs text-gray-400">{it.alt}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {open && <AddImageModal categories={CATEGORIES} onClose={() => setOpen(false)} onSave={(items) => { setItems((prev) => [...items, ...prev]); notify(items.length === 1 ? `"${items[0].title}" added to gallery` : `${items.length} images added to gallery`); }} />}
    </div>
  );
}

function AddImageModal({ categories, onClose, onSave }: {
  categories: string[];
  onClose: () => void;
  onSave: (items: GalleryImage[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ id: string; src: string; title: string }[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Trek Photos");
  const [alt, setAlt] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = pending.length > 0 && (formTitle.trim().length > 0 || pending.every((p) => p.title.trim().length > 0));

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setBusy(true);
    try {
      const added = await Promise.all(files.map(async (f) => ({
        id: genId(),
        src: await toDataUrl(f),
        title: f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim(),
      })));
      setPending((prev) => [...prev, ...added]);
    } finally {
      setBusy(false);
      // Allow re-picking the same files if needed.
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setTitle = (id: string, v: string) => setPending((prev) => prev.map((p) => (p.id === id ? { ...p, title: v } : p)));
  const drop = (id: string) => setPending((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40 p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-label="Add gallery images">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">Add gallery images</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-gray-400 hover:bg-slate-100 hover:text-ink"><X size={18} /></button>
        </div>
        <p className="mb-5 text-sm text-gray-500">Select one or more images from your device — title each one before saving.</p>

        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSave(pending.map((p) => ({ id: p.id, src: p.src, title: (formTitle.trim() || p.title).trim(), category, alt: alt.trim(), date: date.trim(), local: true })));
          onClose();
        }}>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={pick} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
            className={cn("grid w-full place-items-center rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 transition-colors hover:bg-primary/10", busy && "opacity-60")}>
            <span className="flex flex-col items-center gap-2 py-6 text-sm text-gray-500">
              <Upload size={22} className="text-primary" />
              {busy ? "Reading images…" : "Click to choose images from your browser"}
            </span>
          </button>

          {pending.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-ink">{pending.length} image{pending.length > 1 ? "s" : ""} selected</div>
              <div className="grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {pending.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                    <img src={p.src} alt={p.title || "Selected image"} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <input className="w-full rounded-lg border border-line bg-slate-50 px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:bg-white"
                        value={p.title} onChange={(e) => setTitle(p.id, e.target.value)} placeholder="Title" />
                      <div className="mt-1 truncate text-xs text-gray-400">{p.title || "Untitled"}</div>
                    </div>
                    <button type="button" onClick={() => drop(p.id)} aria-label={`Remove ${p.title || "image"}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"><X size={15} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-ink">Title <span className="text-red-500">*</span><span className="font-normal text-gray-400"> — or enter a title per image above</span></span>
            <input className="w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Kalsubai sunrise trek" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-ink">Category for all</span>
              <select className="rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-ink">Date (optional)</span>
              <input className="rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white" value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. 12 Oct 2026" />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-ink">Alt text (applies to all)</span>
            <input className="w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the photos for screen readers" />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!valid}>Save {pending.length} image{pending.length === 1 ? "" : "s"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}