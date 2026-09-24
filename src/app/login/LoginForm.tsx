"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { sendLoginOtp, verifyLoginOtp } from "./actions";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-[10px] border border-line bg-slate-50 px-4 py-3.5 text-[15px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

// Thin top bar that ramps toward ~90% while busy and snaps to 100% on finish —
// a "the app is working" cue so the small wait never feels dead. Placebo by
// design: the width is not tied to real progress (there isn't any to measure).
function ProgressBar({ active }: { active: boolean }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!active) {
      // Finish: jump to 100, then fade out.
      setW((prev) => (prev > 0 ? 100 : 0));
      const t = setTimeout(() => setW(0), 350);
      return () => clearTimeout(t);
    }
    setW(12);
    // Ease toward 90% but never reach it until the action resolves.
    const id = setInterval(() => setW((v) => (v < 90 ? v + (90 - v) * 0.25 : v)), 200);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="mb-4 h-0.5 w-full overflow-hidden rounded bg-transparent" aria-hidden>
      <div
        className="h-full rounded bg-primary transition-[width,opacity] duration-300 ease-out"
        style={{ width: `${w}%`, opacity: w === 0 ? 0 : 1 }}
      />
    </div>
  );
}

export default function LoginForm({
  heading = "Welcome back, Alpha!",
  sub = "Sign in with a one-time code — no password needed.",
  cta = "Log In",
  defaultNext = "/user-dashboard",
}: {
  heading?: string;
  sub?: string;
  cta?: string;
  defaultNext?: string;
}) {
  const params = useSearchParams();
  const next = params.get("next") || defaultNext;

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0); // resend lockout (s)
  const verifiedRef = useRef(false); // guard against double auto-submit

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const NET_ERR = "Something went wrong. Please try again.";

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await sendLoginOtp(email);
      if (r.ok) {
        setStep("otp");
        setNotice(`Code sent to ${email}`);
        setCooldown(30);
      } else setError(r.error);
    } catch {
      setError(NET_ERR); // action threw (stale deployment, network) — don't hang
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await sendLoginOtp(email);
      if (r.ok) {
        setNotice(`New code sent to ${email}`);
        setCooldown(30);
      } else setError(r.error);
    } catch {
      setError(NET_ERR);
    } finally {
      setBusy(false);
    }
  }

  async function verify(codeToCheck: string) {
    if (verifiedRef.current) return;
    verifiedRef.current = true;
    setBusy(true);
    setError(null);
    try {
      // On success the action redirects server-side (throws NEXT_REDIRECT) and
      // the browser navigates — code past this only runs on a failed verify.
      const r = await verifyLoginOtp(email, codeToCheck, next);
      if (r && !r.ok) setError(r.error);
      else return; // redirecting — keep the bar riding through navigation
    } catch (err) {
      // Re-throw Next's redirect signal so navigation proceeds; only real
      // failures fall through to the error state.
      if (err && typeof err === "object" && "digest" in err &&
          typeof (err as { digest?: string }).digest === "string" &&
          (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
        throw err;
      }
      setError(NET_ERR);
    }
    verifiedRef.current = false;
    setBusy(false);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    verify(code);
  }

  function onCodeChange(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 8);
    setCode(digits);
    setError(null);
    // Auto-verify the moment 8 digits are in — removes the extra button press.
    if (digits.length === 8) verify(digits);
  }

  return (
    <div>
      <p className="mb-6 text-lg font-bold">
        <Link href="/" className="text-primary hover:underline">Homepage</Link>
        <span className="mx-2 text-gray-300">\\</span>
        <span className="text-ink">{heading}</span>
      </p>

      <ProgressBar active={busy} />

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {!error && notice && step === "otp" && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>
      )}

      {step === "email" ? (
        <form onSubmit={submitEmail} className="space-y-5">
          <p className="text-sm text-gray-500">{sub}</p>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Email Address</label>
            <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-500"><input type="checkbox" className="accent-primary" /> Remember me</label>
            <Link href="/forgot-password" className="font-medium text-gray-500 hover:text-primary">Trouble signing in?</Link>
          </div>
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Sending code…" : cta}</Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-5">
          <p className="text-sm text-gray-500">Enter the 8-digit code sent to <b className="text-ink">{email}</b>.</p>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Verification code</label>
            <input inputMode="numeric" autoFocus required value={code} maxLength={8} disabled={busy}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="••••••••" className={`${inputCls} tracking-[0.5em] text-center text-xl`} />
          </div>
          <Button type="submit" disabled={busy || code.length !== 8} className="w-full">{busy ? "Verifying…" : "Verify & continue"}</Button>
          <div className="flex justify-between text-sm text-gray-500">
            <button type="button" className="hover:text-primary" onClick={() => { setStep("email"); setCode(""); setError(null); setNotice(null); verifiedRef.current = false; }}>Change email</button>
            <button type="button" disabled={cooldown > 0 || busy} className="hover:text-primary disabled:opacity-50 disabled:hover:text-gray-500" onClick={resend}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
