import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { istToday } from "@/lib/date";
import BookingFlow from "./BookingFlow";
import { paymentProvider } from "@/lib/payment/provider";
import { razorpayKeyId } from "@/lib/payment/razorpay";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  return { title: `Book — ${params.slug}` };
}

export default async function BookPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = createClient(await cookies());

  const { data: trek } = await supabase
    .from("treks")
    .select("id,slug,title,summary,location,state,base_price,child_price,boarding_disclaimer,status,deleted_at")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!trek || trek.status !== "published" || trek.deleted_at) notFound();

  // All independent of each other (departures/addons only need trek.id) - fetch in parallel.
  const [{ data: departures }, { data: addons }, { data: { user } }, { data: teamMembers }, { data: boardingLocations }] = await Promise.all([
    supabase
      .from("trek_departures")
      .select("id,start_date,end_date,capacity,booked_seats,price_override,status")
      .eq("trek_id", trek.id)
      .neq("status", "cancelled")
      .gte("start_date", istToday())
      .order("start_date", { ascending: true }),
    supabase
      .from("trek_addons")
      .select("id,name,price")
      .eq("trek_id", trek.id)
      .eq("active", true)
      .order("position", { ascending: true }),
    supabase.auth.getUser(),
    supabase.from("team_members").select("id,name").eq("active", true).order("position", { ascending: true }),
    supabase.from("trek_boarding_locations").select("id,name,subtext,price").eq("trek_id", trek.id).order("position", { ascending: true }),
  ]);

  return (
    <BookingFlow
      trek={{
        id: trek.id,
        slug: trek.slug,
        title: trek.title,
        summary: trek.summary,
        base_price: trek.base_price ?? 0,
        child_price: trek.child_price ?? null,
        place: trek.location || trek.state || "India",
      }}
      departures={departures ?? []}
      addons={addons ?? []}
      payMode={payModeNow()}
      user={user?.email ? { email: user.email } : null}
      teamMembers={teamMembers ?? []}
      boardingLocations={boardingLocations ?? []}
      boardingDisclaimer={trek.boarding_disclaimer ?? null}
    />
  );
}

// What the pay step tells the customer. Test mode = mock, or Razorpay test keys.
function payModeNow() {
  const provider = paymentProvider();
  return { provider, testMode: provider === "mock" || (provider === "razorpay" && razorpayKeyId().startsWith("rzp_test_")) };
}
