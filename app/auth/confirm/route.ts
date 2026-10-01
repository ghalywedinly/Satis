import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { HOME_PATH } from "@/lib/auth/routes";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { isSupabaseConfigured, publicEnv } from "@/lib/env/public";
import { getPathname } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: readonly EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Target of every auth email link (sign-up verification, password reset, email change).
 * Verifies the one-time token, which creates the session, then continues in the user's language.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const requestedLocale = params.get("lang");
  let locale: Locale = routing.locales.includes(requestedLocale as Locale) ? (requestedLocale as Locale) : routing.defaultLocale;
  const to = (href: string) => NextResponse.redirect(new URL(getPathname({ locale, href }), request.url));

  if (!isSupabaseConfigured() || !tokenHash || !type || !OTP_TYPES.includes(type)) {
    return to("/login?error=linkInvalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error || !data.user) return to("/login?error=linkInvalid");

  const { data: profile } = await supabase.from("profiles").select("locale").eq("id", data.user.id).maybeSingle();
  if (profile?.locale) locale = profile.locale;

  if (type === "recovery") return to("/reset-password");
  const next = safeRedirectPath(params.get("next"), publicEnv.NEXT_PUBLIC_SITE_URL);
  if (next) return NextResponse.redirect(new URL(next, request.url));
  return to(HOME_PATH);
}
