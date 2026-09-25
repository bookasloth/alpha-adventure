"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/admin/data";

type Result = { ok: true } | { ok: false; error: string };

// Admin-cancel a booking. Does not auto-refund seats/payment — that's a
// separate reconciliation step; this just flags the booking cancelled.
export async function cancelBooking(id: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { console.error("[cancelBooking]", error.message); return { ok: false, error: "Could not cancel the booking." }; }
  revalidatePath("/admin");
  revalidatePath("/user-dashboard");
  return { ok: true };
}
