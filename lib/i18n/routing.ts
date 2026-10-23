import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  // Arabic is the primary language: served at "/", English at "/en".
  defaultLocale: "ar",
  localePrefix: "as-needed",
  // Saudi visitors often run English-language browsers; don't let Accept-Language
  // override the Arabic default. Language changes are explicit (switcher or profile).
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const localeDirection = (locale: Locale): "rtl" | "ltr" => (locale === "ar" ? "rtl" : "ltr");
