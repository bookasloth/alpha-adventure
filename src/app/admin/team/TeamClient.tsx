"use client";

import { revealOnMount } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTeamMember, renameTeamMember, setTeamMemberActive, type TeamMember } from "./actions";

const inp = "w-full rounded-[10px] border border-line bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15";

export default function TeamClient({ members }: { members: TeamMember[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  async function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, onOk?: () => void) {
    setBusy(true); setError(null);
    try {
      const r = await fn();
      if (r.ok) { onOk?.(); router.refresh(); } else setError(r.error);
    } catch { setError("Something went wrong. Please try again."); }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-gray-500 hover:bg-slate-100"><ArrowLeft size={18} /></Link>
        <div><h1 className="text-2xl font-bold">Account managers</h1><p className="text-sm text-gray-500">Offered as an optional dropdown at checkout, to attribute bookings for commission.</p></div>
      </div>
      {error && <div ref={revealOnMount} role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      <Card>
        <CardHeader><CardTitle>Add a team member</CardTitle></CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => createTeamMember(newName), () => setNewName("")); }}>
            <input className={inp} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" maxLength={120} />
            <Button type="submit" disabled={busy || !newName.trim()}>Add</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Team ({members.length})</CardTitle></CardHeader>
        <CardContent className="divide-y divide-line p-0">
          {members.length === 0 && <p className="py-10 text-center text-sm text-gray-400">No team members yet — add one.</p>}
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-6 py-3">
              {editing?.id === m.id ? (
                <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); run(() => renameTeamMember(m.id, editing.name), () => setEditing(null)); }}>
                  <input className={inp} autoFocus value={editing.name} onChange={(e) => setEditing({ id: m.id, name: e.target.value })} maxLength={120} />
                  <Button type="submit" size="sm" disabled={busy}>Save</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                </form>
              ) : (
                <>
                  <span className={`flex-1 text-sm font-medium ${m.active ? "text-ink" : "text-gray-400 line-through"}`}>{m.name}</span>
                  {!m.active && <span className="text-xs text-gray-400">Inactive</span>}
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => setEditing({ id: m.id, name: m.name })}>Rename</Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => setTeamMemberActive(m.id, !m.active))}>{m.active ? "Deactivate" : "Activate"}</Button>
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
