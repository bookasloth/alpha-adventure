"use server";

import { requireAdmin } from "@/app/admin/data";
import { createAdminClient } from "@/utils/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/gif": "gif", "image/avif": "avif", "image/svg+xml": "svg",
};

// Hand the admin browser a one-shot signed upload URL for the public `media`
// bucket. The file itself goes browser -> Supabase directly (XHR, so the UI
// gets real progress) instead of through a server action, which had no
// progress, no timeout, and hit Vercel's ~4.5 MB function body cap.
export async function createImageUpload(
  meta: { type: string; size: number; folder?: string },
): Promise<{ ok: true; uploadUrl: string; publicUrl: string } | { ok: false; error: string }> {
  await requireAdmin();

  if (!ALLOWED.has(meta.type)) return { ok: false, error: "Use a JPG, PNG, WebP, GIF, AVIF or SVG image." };
  if (meta.size > MAX_BYTES) return { ok: false, error: "Image is too large (max 5 MB)." };
  const folder = String(meta.folder || "misc").replace(/[^a-z0-9/_-]/gi, "") || "misc";
  const path = `${folder}/${crypto.randomUUID()}.${EXT[meta.type]}`;

  const admin = createAdminClient();
  let { data, error } = await admin.storage.from("media").createSignedUploadUrl(path);
  if (error && /not found/i.test(error.message)) {
    // No migration creates the bucket; make it on first use.
    await admin.storage.createBucket("media", { public: true, fileSizeLimit: MAX_BYTES });
    ({ data, error } = await admin.storage.from("media").createSignedUploadUrl(path));
  }
  if (error || !data) {
    console.error("[createImageUpload]", error?.message);
    return { ok: false, error: "Could not start upload (storage not reachable)." };
  }

  return { ok: true, uploadUrl: data.signedUrl, publicUrl: admin.storage.from("media").getPublicUrl(path).data.publicUrl };
}
