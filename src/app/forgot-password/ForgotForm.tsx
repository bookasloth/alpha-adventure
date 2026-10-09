"use client";

import { useState } from "react";
import { requestPasswordReset } from "../login/actions";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-[10px] border border-line bg-slate-50 px-4 py-3.5 text-[15px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await requestPasswordReset(email);
      // Only a rate-limit/validation error comes back; account existence is never revealed.
      if (!r.ok) setError(r.error);
      else setNotice("If that email has an account, a reset link is on its way.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return notice ? (
    <p className="text-sm text-green-700">{notice}</p>
  ) : (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-sm text-gray-500">Enter your email and we&apos;ll send a reset link.</p>
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Sending…" : "Send reset link"}</Button>
    </form>
  );
}
