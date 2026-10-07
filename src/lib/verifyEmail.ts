import "server-only";
import crypto from "crypto";
import { sendVerifyEmail as mailVerify } from "./email";
import { siteUrl } from "./siteUrl";
import { tokenSigningSecret } from "./signing";

// Non-blocking email ownership check: an HMAC-signed link (like the booking
// payToken bearer) delivered by our own mailer. Clicking it sets
// profiles.email_verified; it gates nothing.
const secret = tokenSigningSecret;
export function signVerifyToken(userId: string): string {
  const mac = crypto.createHmac("sha256", secret()).update(`verify:${userId}`).digest("hex");
  return `${userId}.${mac}`;
}
export function verifyVerifyToken(value?: string | null): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = value.slice(0, dot);
  const good = crypto.createHmac("sha256", secret()).update(`verify:${userId}`).digest("hex");
  const a = Buffer.from(value.slice(dot + 1));
  const b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}
export async function sendVerifyEmail(userId: string, to: string): Promise<void> {
  const link = `${siteUrl()}/verify-email?token=${encodeURIComponent(signVerifyToken(userId))}`;
  await mailVerify(to, link);
}
