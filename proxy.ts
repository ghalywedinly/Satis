import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { HOME_PATH, isGuestOnlyPath, isProtectedPath } from "@/lib/auth/routes";
import { routing, type Locale } from "@/lib/i18n/routing";
import { refreshSession } from "@/lib/supabase/proxy";

const handleI18nRouting = createIntlMiddleware(routing);

function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  const explicit = routing.locales.find((l) => l === first);
  if (explicit) return { locale: explicit, path: `/${rest.join("/")}` };
  return { locale: routing.defaultLocale, path: pathname };
}

function localized(locale: Locale, path: string) {
  return locale === routing.defaultLocale ? path : `/${locale}${path === "/" ? "" : path}`;
}

/** Redirect that keeps any session cookies refreshed on `from`. */
function redirectWithCookies(request: NextRequest, from: NextResponse, to: string) {
  const redirect = NextResponse.redirect(new URL(to, request.url));
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);
  // next-intl is normalizing the URL (e.g. "/ar/x" → "/x"); let that redirect through first.
  if (response.headers.has("location")) return response;

  const { userId } = await refreshSession(request, response);
  const { locale, path } = splitLocale(request.nextUrl.pathname);

  if (!userId && isProtectedPath(path)) {
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    return redirectWithCookies(request, response, `${localized(locale, "/login")}?next=${encodeURIComponent(next)}`);
  }
  if (userId && isGuestOnlyPath(path)) {
    return redirectWithCookies(request, response, localized(locale, HOME_PATH));
  }
  return response;
}

export const config = {
  // Skip API routes, auth link handling, analytics/monitoring tunnels, the public survey,
  // Next internals and files with an extension.
  matcher: ["/((?!api|auth|ingest|monitoring|s/|_next|_vercel|.*\\..*).*)"],
};
