"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sendLoginOtp, verifyLoginOtp } from "./actions";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-[10px] border border-line bg-slate-50 px-4 py-3.5 text-[15px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

export default function LoginForm({
  heading = "Welcome Back, Navodian",
  sub = "Sign in with a one-time code — no password needed.",
  cta = "Log In",
  defaultNext = "/user-dashboard",
}: {
  heading?: string;
  sub?: string;
  cta?: string;
  defaultNext?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || defaultNext;

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await sendLoginOtp(email);
    setBusy(false);
    if (r.ok) setStep("otp");
    else setError(r.error);
  }
  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await verifyLoginOtp(email, code);
    setBusy(false);
    if (r.ok) router.replace(next);
    else setError(r.error);
  }

  return (
    <div>
      <p className="mb-6 text-lg font-bold">
        <Link href="/" className="text-primary hover:underline">Homepage</Link>
        <span className="mx-2 text-gray-300">\\</span>
        <span className="text-ink">{heading}</span>
      </p>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

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
            <input inputMode="numeric" autoFocus required value={code} maxLength={8}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="••••••••" className={`${inputCls} tracking-[0.5em] text-center text-xl`} />
          </div>
          <Button type="submit" disabled={busy || code.length !== 8} className="w-full">{busy ? "Verifying…" : "Verify & continue"}</Button>
          <div className="flex justify-between text-sm text-gray-500">
            <button type="button" className="hover:text-primary" onClick={() => { setStep("email"); setCode(""); setError(null); }}>Change email</button>
            <button type="button" className="hover:text-primary" onClick={() => sendLoginOtp(email)}>Resend code</button>
          </div>
        </form>
      )}
    </div>
  );
}
