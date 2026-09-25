"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/data";
import { sendMail } from "@/lib/mailer";
import { background } from "@/lib/after";

type Result = { ok: true } | { ok: false; error: string };

const statusSchema = z.enum(["new", "replied", "closed"]);

export async function updateLeadStatus(id: string, status: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const s = statusSchema.safeParse(status);
  if (!s.success) return { ok: false, error: "Invalid status." };
  const { error } = await admin.from("leads").update({ status: s.data }).eq("id", id);
  if (error) { console.error("[updateLeadStatus]", error.message); return { ok: false, error: "Could not update status." }; }
  revalidatePath("/admin");
  return { ok: true };
}

const replySchema = z.object({
  subject: z.string().trim().min(1, "Subject required").max(200),
  body: z.string().trim().min(1, "Message required").max(5000),
});

// Email the enquirer and mark the lead replied. Send is non-blocking; the
// status update is what the admin sees confirmed.
export async function replyToLead(id: string, raw: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const parsed = replySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { data: lead } = await admin.from("leads").select("email,name").eq("id", id).maybeSingle();
  if (!lead?.email) return { ok: false, error: "Lead has no email address." };

  const html = `<p>Hi ${lead.name || "there"},</p>${parsed.data.body
    .split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("")}<p>— Alpha Adventures</p>`;
  background(sendMail(lead.email, parsed.data.subject, html));

  const { error } = await admin.from("leads").update({ status: "replied" }).eq("id", id);
  if (error) { console.error("[replyToLead]", error.message); return { ok: false, error: "Reply sent, but status update failed." }; }
  revalidatePath("/admin");
  return { ok: true };
}
