"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/admin/data";

type Result = { ok: true } | { ok: false; error: string };
export type TeamMember = { id: string; name: string; active: boolean; position: number };

const nameSchema = z.string().trim().min(1, "Name required").max(120);
const done = () => { revalidatePath("/admin/team"); revalidatePath("/book", "layout"); };

export async function listTeam(): Promise<TeamMember[]> {
  const { admin } = await requireAdmin();
  const { data } = await admin.from("team_members").select("id,name,active,position").order("position").order("name");
  return data ?? [];
}

export async function createTeamMember(rawName: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const name = nameSchema.safeParse(rawName);
  if (!name.success) return { ok: false, error: name.error.issues[0]?.message ?? "Invalid input." };
  // Append after the current last position.
  const { data: last } = await admin.from("team_members").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await admin.from("team_members").insert({ name: name.data, position: (last?.position ?? -1) + 1 });
  if (error) { console.error("[createTeamMember]", error.message); return { ok: false, error: "Could not add." }; }
  done();
  return { ok: true };
}

export async function renameTeamMember(id: string, rawName: unknown): Promise<Result> {
  const { admin } = await requireAdmin();
  const name = nameSchema.safeParse(rawName);
  if (!name.success) return { ok: false, error: name.error.issues[0]?.message ?? "Invalid input." };
  const { error } = await admin.from("team_members").update({ name: name.data }).eq("id", id);
  if (error) { console.error("[renameTeamMember]", error.message); return { ok: false, error: "Could not save." }; }
  done();
  return { ok: true };
}

// Deactivate instead of delete: past bookings keep their account-manager tag.
export async function setTeamMemberActive(id: string, active: boolean): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("team_members").update({ active }).eq("id", id);
  if (error) { console.error("[setTeamMemberActive]", error.message); return { ok: false, error: "Could not update." }; }
  done();
  return { ok: true };
}
