"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, register, requestPasswordReset } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { safeNext } from "@/lib/safeNext";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-[10px] border border-line bg-slate-50 px-4 py-3.5 text-[15px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

// Thin top bar that ramps toward ~90% while busy and snaps to 100% on finish —
// a "the app is working" cue. Placebo by design (no real progress to measure).
function ProgressBar({ active }: { active: boolean }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!active) {
      setW((prev) => (prev > 0 ? 100 : 0));
      const t = setTimeout(() => setW(0), 350);
      return () => clearTimeout(t);
    }
    setW(12);
    const id = setInterval(() => setW((v) => (v < 90 ? v + (90 - v) * 0.25 : v)), 200);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div className="mb-4 h-0.5 w-full overflow-hidden rounded bg-transparent" aria-hidden>
      <div className="h-full rounded bg-primary transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${w}%`, opacity: w === 0 ? 0 : 1 }} />
    </div>
  );
}

export default function LoginForm({
  mode = "signin",
  heading,
  sub,
  defaultNext = "/user-dashboard",
  nextParam,
}: {
  mode?: "signin" | "register";
  heading?: string;
  sub?: string;
  defaultNext?: string;
  /** Raw ?next= from the page's searchParams (validated by safeNext). Passed
   *  in rather than read via useSearchParams so the form is server-rendered
   *  instead of blank until JS loads behind a Suspense bailout. */
  nextParam?: string;
}) {
  const router = useRouter();
  const next = safeNext(nextParam, defaultNext);
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const NET_ERR = "Something went wrong. Please try again.";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      // 1. Server: rate-limited credential check (sign in) / account creation (register).
      const r = isRegister ? await register(name, email, password) : await signIn(email, password);
      if (!r.ok) { setError(r.error); setBusy(false); return; }
      // 2. Client: establish the session in the browser (server-action cookies
      //    don't reach the browser in this app), then navigate.
      const supabase = createClient();
      // This is the single credential check (server only rate-limited + validated).
      // On login, a failure here means bad credentials; on register it shouldn't
      // happen (account was just created), so keep the generic message.
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) { setError(isRegister ? NET_ERR : "Email or password is incorrect."); setBusy(false); return; }
      router.push(next);
      router.refresh(); // drop the pre-auth router cache so the dashboard renders authed
    } catch {
      setError(NET_ERR);
      setBusy(false);
    }
  }

  async function onForgot() {
    setError(null); setNotice(null);
    if (!/.+@.+\..+/.test(email)) { setError("Enter your email above first."); return; }
    setBusy(true);
    try { await requestPasswordReset(email); setNotice("If that email has an account, a reset link is on its way."); }
    catch { setError(NET_ERR); }
    setBusy(false);
  }

  return (
    <div>
      <p className="mb-6 text-lg font-bold">
        <Link href="/" className="text-primary hover:underline">Homepage</Link>
        <span className="mx-2 text-gray-300">\\</span>
        <span className="text-ink">{heading ?? (isRegister ? "Create your account" : "Welcome back!")}</span>
      </p>

      <ProgressBar active={busy} />

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {notice && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <form onSubmit={onSubmit} className="space-y-5">
        {sub && <p className="text-sm text-gray-500">{sub}</p>}
        {isRegister && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Full name</label>
            <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Email Address</label>
          <input type="email" required autoFocus={!isRegister} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">Password</label>
          <div className="relative">
            <input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? "8+ chars, 1 capital, 1 number, 1 symbol" : "Your password"} className={inputCls} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{show ? "Hide" : "Show"}</button>
          </div>
          {isRegister && <p className="mt-1.5 text-xs text-gray-500">At least 8 characters, one capital, one number, one special character. Don&apos;t use your name or email.</p>}
        </div>
        {!isRegister && (
          <div className="flex justify-end text-sm">
            <button type="button" onClick={onForgot} disabled={busy} className="font-medium text-gray-500 hover:text-primary disabled:opacity-50">Forgot password?</button>
          </div>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? (isRegister ? "Creating…" : "Signing in…") : (isRegister ? "Create account" : "Log In")}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {isRegister
          ? (<>Already a member? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></>)
          : (<>New here? <Link href="/signup" className="font-semibold text-primary hover:underline">Create an account</Link></>)}
      </p>
    </div>
  );
}
