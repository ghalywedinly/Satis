import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";
import type { Database } from "@/types/database";

/**
 * Privileged client using the secret key. BYPASSES Row Level Security.
 * Only for trusted server code that has already authorized the request
 * (webhooks, rate limiting, background jobs). Never pass user input through unchecked.
 */
export function createSupabaseAdminClient() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = serverEnv.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
