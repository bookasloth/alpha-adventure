"use server";

import { requireAdmin } from "@/app/admin/data";
import { createAdminClient } from "@/utils/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "image/avif": "avif", "image/svg+xml": "svg",
};

// Upload an image to the public `media` bucket (service role, behind the admin
// gate) and return its public URL. Used by the ImageField upload button on the
// admin trek/tour/gallery/testimonial forms.
export async function uploadImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireAdmin();

  const file = formData.get("file");
  const folder = String(formData.get("folder") || "misc").replace(/[^a-z0-9/_-]/gi, "") || "misc";
  if (!(file instanceof File)) return { ok: false, error: "No file received." };
  if (!ALLOWED.has(file.type)) return { ok: false, error: "Use a JPG, PNG, WebP, GIF, AVIF or SVG image." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image is too large (max 5 MB)." };

  const admin = createAdminClient();
  const ext = EXT[file.type] ?? "bin";
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${folder}/${name}`;

  const { error } = await admin.storage.from("media").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[uploadImage]", error.message);
    return { ok: false, error: "Upload failed. Is the 'media' storage bucket set up?" };
  }

  const { data } = admin.storage.from("media").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
