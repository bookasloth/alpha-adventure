import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import BookingFlow from "./BookingFlow";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return { title: `Book — ${params.slug}` };
}

export default async function BookPage({ params }: { params: { slug: string } }) {
  const supabase = createClient(cookies());

  const { data: trek } = await supabase
    .from("treks")
    .select("id,slug,title,summary,location,state,base_price,child_price,status,deleted_at")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!trek || trek.status !== "published" || trek.deleted_at) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const { data: departures } = await supabase
    .from("trek_departures")
    .select("id,start_date,end_date,capacity,booked_seats,price_override,status")
    .eq("trek_id", trek.id)
    .neq("status", "cancelled")
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  const { data: addons } = await supabase
    .from("trek_addons")
    .select("id,name,price")
    .eq("trek_id", trek.id)
    .eq("active", true)
    .order("position", { ascending: true });

  return (
    <BookingFlow
      trek={{
        id: trek.id,
        title: trek.title,
        summary: trek.summary,
        base_price: trek.base_price ?? 0,
        child_price: trek.child_price ?? null,
        place: trek.location || trek.state || "India",
      }}
      departures={departures ?? []}
      addons={addons ?? []}
    />
  );
}
