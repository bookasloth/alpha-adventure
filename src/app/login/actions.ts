"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { emailSchema, otpSchema } from "@/domain/booking/schema";

type Result = { ok: true } | { ok: false; error: string };

export async function sendLoginOtp(rawEmail: unknown): Promise<Result> {
  const e = emailSchema.safeParse(rawEmail);
  if (!e.success) return { ok: false, error: e.error.issues[0]?.message ?? "Invalid email." };
  const supabase = createClient(cookies());
  const { error } = await supabase.auth.signInWithOtp({
    email: e.data,
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, error: "Could not send the code. Please try again." };
  return { ok: true };
}

export async function verifyLoginOtp(rawEmail: unknown, rawCode: unknown): Promise<Result> {
  const e = emailSchema.safeParse(rawEmail);
  const c = otpSchema.safeParse(rawCode);
  if (!e.success || !c.success) return { ok: false, error: "Enter the 6-digit code." };
  const supabase = createClient(cookies());
  const { error } = await supabase.auth.verifyOtp({ email: e.data, token: c.data, type: "email" });
  if (error) return { ok: false, error: "That code is incorrect or expired." };
  return { ok: true };
}

export async function signOut() {
  const supabase = createClient(cookies());
  await supabase.auth.signOut();
  redirect("/");
}
