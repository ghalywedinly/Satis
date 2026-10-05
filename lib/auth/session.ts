import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env/public";
import { redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

/** The verified signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Always per-request, even when Supabase isn't configured at build time.
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return null;
  return { id: data.claims.sub, email: typeof data.claims.email === "string" ? data.claims.email : null };
});

/** For protected pages: the signed-in user, or a redirect to the login page. */
export async function requireUser(locale: Locale): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login", locale });
  return user;
}

export const getProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("full_name, locale").eq("id", userId).maybeSingle();
  return data;
});
