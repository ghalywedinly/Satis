import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, publicEnv } from "@/lib/env/public";
import type { Database } from "@/types/database";

/**
 * Supabase client acting as the signed-in user (their session cookie), so Row Level
 * Security applies to every query. Use in Server Components, Server Actions and Route Handlers.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) throw new SupabaseNotConfiguredError();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components can't set cookies; the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
}
