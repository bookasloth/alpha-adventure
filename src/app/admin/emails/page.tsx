import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/app/admin/data";
import { emailPreviews } from "@/lib/emailTemplates";
import { siteUrl } from "@/lib/siteUrl";

export const metadata = { title: "Email templates", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Every transactional email rendered with sample data, so the operator (and
// the client) can review copy and design without triggering real sends.
export default async function EmailPreviewPage() {
  await requireAdmin();
  const previews = emailPreviews(siteUrl());
  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" aria-label="Back to admin" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-gray-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl font-bold">Email templates</h1>
            <p className="text-sm text-gray-500">{previews.length} emails, shown with sample data. Nothing here is sent.</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {previews.map((e) => (
            <a key={e.key} href={`#${e.key}`} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary">{e.label}</a>
          ))}
        </nav>
        {previews.map((e) => (
          <section key={e.key} id={e.key} className="scroll-mt-6 overflow-hidden rounded-xl2 border border-line/70 bg-white shadow-soft">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{e.label}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${e.audience === "Customer" ? "bg-primary/10 text-primary" : "bg-slate-100 text-gray-600"}`}>{e.audience}</span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">Sent when: {e.when}</p>
                <p className="mt-2 break-words text-sm"><span className="text-gray-400">Subject:</span> <span className="font-medium">{e.r.subject}</span></p>
              </div>
            </header>
            <iframe title={e.label} srcDoc={e.r.html} sandbox="" className="h-[720px] w-full border-0 bg-[#f4f1ee]" loading="lazy" />
            <details className="border-t border-line/70 p-5 text-sm">
              <summary className="cursor-pointer font-medium text-gray-600">Plain-text version</summary>
              <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-gray-700">{e.r.text}</pre>
            </details>
          </section>
        ))}
      </div>
    </div>
  );
}
