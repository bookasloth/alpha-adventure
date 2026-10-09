"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { passwordSchema } from "@/domain/booking/schema";

const inputCls =
  "w-full rounded-[10px] border border-line bg-slate-50 px-4 py-3.5 text-[15px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

export default function ResetForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  // null = still exchanging the link's token; don't flash "open from email".
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A server-minted recovery link can land three ways: a hash session
  // (#access_token, auto-detected), ?code (PKCE-style exchange), or
  // ?token_hash&type=recovery. Handle all so the happy path can't silently die.
  useEffect(() => {
    let cancelled = false;
    async function establish() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (tokenHash && type === "recovery") {
          await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
        }
      } catch { /* fall through to session check */ }
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setReady(!!data.session);
    }
    establish();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session) setReady(true); });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pw = passwordSchema.safeParse(password);
    if (!pw.success) { setError(pw.error.issues[0]!.message); return; }
    setBusy(true); setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError("This reset link is invalid or expired. Request a new one."); setBusy(false); return; }
      router.replace("/user-dashboard"); // stay busy through the navigation
    } catch {
      setError("Network problem. Please try again.");
      setBusy(false);
    }
  }

  if (ready === null)
    return <p role="status" className="text-sm text-gray-500">Checking your reset link…</p>;
  if (!ready)
    return (
      <p className="text-sm text-gray-500">
        Open this page from your reset email.{" "}
        <a className="text-primary hover:underline" href="/forgot-password">Request a new link</a>.
      </p>
    );
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink">New password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="8+ chars, 1 capital, 1 number, 1 symbol" className={inputCls} />
      </div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Set new password"}</Button>
    </form>
  );
}
