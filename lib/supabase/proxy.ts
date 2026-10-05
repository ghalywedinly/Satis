import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, publicEnv } from "@/lib/env/public";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase session cookie on the outgoing response and returns the
 * verified user id (or null). Runs in proxy.ts on every page request.
 */
export async function refreshSession(request: NextRequest, response: NextResponse) {
  if (!isSupabaseConfigured()) return { userId: null };

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims() verifies the JWT; never trust getSession() on the server.
  const { data } = await supabase.auth.getClaims();
  return { userId: data?.claims?.sub ?? null };
}
