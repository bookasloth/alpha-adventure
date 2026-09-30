import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendBookingReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Cron: pre-departure reminders. Sends once per booking (stamped via
// reminder_sent_at, migration 0021) for confirmed bookings departing within the
// next REMIND_DAYS days. Auth mirrors expire-bookings: fail-closed in prod.
const REMIND_DAYS = 2;

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[cron] CRON_SECRET unset — refusing to run.");
      return NextResponse.json({ ok: false, error: "cron not configured" }, { status: 500 });
    }
  } else {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  // IST window: [today, today + REMIND_DAYS]. departure_date is a plain date.
  const istNow = new Date(Date.now() + 5.5 * 3600 * 1000);
  const today = istNow.toISOString().slice(0, 10);
  const until = new Date(istNow.getTime() + REMIND_DAYS * 86400000).toISOString().slice(0, 10);

  const { data: due, error } = await admin
    .from("bookings")
    .select("id,reference,trek_title,departure_date,adults,children,contact_email")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .not("contact_email", "is", null)
    .gte("departure_date", today)
    .lte("departure_date", until);
  if (error) {
    console.error("[cron] booking-reminders query failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0, failed = 0;
  for (const b of due ?? []) {
    try {
      await sendBookingReminderEmail({
        to: b.contact_email as string,
        reference: b.reference,
        trekTitle: b.trek_title ?? "your trek",
        departureDate: b.departure_date,
        seats: (b.adults ?? 0) + (b.children ?? 0),
        total: 0,
      });
      // Stamp only after a successful send so a failure retries next run.
      await admin.from("bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", b.id);
      sent++;
    } catch (e) {
      failed++;
      console.error("[cron] reminder failed for", b.reference, (e as Error).message);
    }
  }
  return NextResponse.json({ ok: true, sent, failed });
}

export const GET = run;
export const POST = run;
