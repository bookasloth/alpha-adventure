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
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The recovery link lands with a session in the URL; @supabase/ssr picks it up.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pw = passwordSchema.safeParse(password);
    if (!pw.success) { setError(pw.error.issues[0]!.message); return; }
    setBusy(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setError("This reset link is invalid or expired. Request a new one."); return; }
    router.replace("/user-dashboard");
  }

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
