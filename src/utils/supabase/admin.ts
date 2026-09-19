import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. SERVER-ONLY — bypasses RLS. Used for guest
// (pre-account) booking writes and the booking RPCs. NEVER import this into a
// client component, and NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for booking server actions.",
    );
  }
  return createClient(url!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
