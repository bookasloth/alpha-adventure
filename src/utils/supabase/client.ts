import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Browser-side Supabase client (anon/publishable key, RLS-enforced). Currently
// unused (all reads are server-side). If used from a client component, the URL
// and key must be exposed to the browser bundle (NEXT_PUBLIC_-prefixed vars or
// a next.config `env` mapping) — plain SUPABASE_* are server-only.
export const createClient = () => createBrowserClient(supabaseUrl!, supabaseKey!);
