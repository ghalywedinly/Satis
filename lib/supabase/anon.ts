import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicEnv } from "@/lib/env/public";
import type { Database } from "@/types/database";

/** Session-less client with the publishable key: exactly what an anonymous visitor may do. */
export function createSupabaseAnonClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL!, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
