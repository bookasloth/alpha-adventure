import { publicClient } from "@/lib/seo";

export type GalleryAlbum = {
  slug: string;
  title: string;
  subtitle: string | null;
  hero: string | null;
  hero_alt: string | null;
};

const SELECT = "slug,title,subtitle,hero,hero_alt";

export async function getGalleryAlbums(): Promise<GalleryAlbum[]> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("gallery_albums")
    .select(SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("sort")
    .order("title");
  return (data ?? []) as GalleryAlbum[];
}

export async function getGalleryAlbum(slug: string): Promise<GalleryAlbum | null> {
  const supabase = publicClient();
  const { data } = await supabase
    .from("gallery_albums")
    .select(SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  return (data ?? null) as GalleryAlbum | null;
}
