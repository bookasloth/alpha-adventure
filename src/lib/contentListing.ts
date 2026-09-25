import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type Testimonial = {
  author: string;
  role: string | null;
  rating: number;
  body: string;
  avatar_url: string | null;
};

// Published testimonials for the home slider, ordered by position.
export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = createClient(cookies());
  const { data } = await supabase
    .from("testimonials")
    .select("author_name,role,rating,body,avatar_url")
    .eq("status", "published")
    .order("position");
  return (data ?? []).map((t) => ({
    author: t.author_name,
    role: t.role,
    rating: t.rating ?? 5,
    body: t.body,
    avatar_url: t.avatar_url,
  }));
}
