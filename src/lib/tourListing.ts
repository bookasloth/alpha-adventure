import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type Tour = {
  slug: string;
  title: string;
  type: string | null;
  duration: string | null;
  price: number; // rupees
  image: string | null;
  description: string | null;
};

const mapTour = (t: {
  slug: string; title: string; type: string | null; duration: string | null;
  base_price: number | null; image: string | null; description: string | null;
}): Tour => ({
  slug: t.slug,
  title: t.title,
  type: t.type,
  duration: t.duration,
  price: Math.round((t.base_price ?? 0) / 100),
  image: t.image,
  description: t.description,
});

const SELECT = "slug,title,type,duration,base_price,image,description";

// All published tours (featured first), for the listing + home slider.
export async function getTours(): Promise<Tour[]> {
  const supabase = createClient(cookies());
  const { data } = await supabase
    .from("tours")
    .select(SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("featured", { ascending: false })
    .order("sort")
    .order("title");
  return (data ?? []).map(mapTour);
}

// One published tour by slug, or null (page 404s).
export async function getTourBySlug(slug: string): Promise<Tour | null> {
  const supabase = createClient(cookies());
  const { data } = await supabase
    .from("tours")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  return data ? mapTour(data) : null;
}
