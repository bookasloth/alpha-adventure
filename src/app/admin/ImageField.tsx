"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { uploadImage } from "./upload/actions";

// URL input + "Upload" button. Keeps the paste-a-URL option and adds direct
// image upload to the `media` bucket; on success the returned public URL fills
// the field. Drop-in replacement for the plain image <input> on admin forms.
export default function ImageField({
  value,
  onChange,
  className,
  placeholder,
  folder = "misc",
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  placeholder?: string;
  folder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setErr(null);
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);
    const r = await uploadImage(fd);
    setBusy(false);
    if (r.ok) onChange(r.url);
    else setErr(r.error);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input className={className} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-slate-100 disabled:opacity-50"
        >
          <Upload size={15} /> {busy ? "Uploading…" : "Upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      </div>
      {err && <p className="mt-1 text-xs font-medium text-red-600">{err}</p>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-20 w-32 rounded-lg border border-line object-cover" />
      )}
    </div>
  );
}
