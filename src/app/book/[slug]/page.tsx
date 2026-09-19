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
    .select("id,slug,title,base_price,status,deleted_at")
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
    <section className="section">
      <div className="container-px" style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}>
        <h1 className="section-title" style={{ marginBottom: 8 }}>Book {trek.title}</h1>
        <BookingFlow
          trek={{ id: trek.id, title: trek.title, base_price: trek.base_price ?? 0 }}
          departures={departures ?? []}
          addons={addons ?? []}
        />
      </div>
    </section>
  );
}
