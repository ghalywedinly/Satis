import type { Metadata } from "next";
import { publicEnv } from "@/lib/env/public";
import { routing, type Locale } from "@/lib/i18n/routing";

/** The site's address without a trailing slash, e.g. "https://www.satis-app.com". */
export const siteOrigin = () => publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/** Absolute URL of a public page in a language: Arabic at "/…", English at "/en/…". */
export function siteUrl(locale: Locale, path: string) {
  const base = siteOrigin();
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const rest = path === "/" ? "" : path;
  return `${base}${prefix}${rest}` || base;
}

/** Every language version of a page, for hreflang links and the sitemap. */
export function languageUrls(path: string) {
  return {
    ...Object.fromEntries(routing.locales.map((l) => [l, siteUrl(l, path)])),
    "x-default": siteUrl(routing.defaultLocale, path),
  } as Record<Locale | "x-default", string>;
}

/** Canonical and hreflang metadata for a public page. */
export function pageAlternates(locale: Locale, path: string): Metadata["alternates"] {
  return { canonical: siteUrl(locale, path), languages: languageUrls(path) };
}
