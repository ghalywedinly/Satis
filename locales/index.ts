import type { Locale } from "@/lib/i18n/routing";

// Each locale is split into namespaces; add a file to both ar/ and en/ and register it here.
const load = {
  ar: async () => ({
    common: (await import("./ar/common.json")).default,
    metadata: (await import("./ar/metadata.json")).default,
    home: (await import("./ar/home.json")).default,
    auth: (await import("./ar/auth.json")).default,
    errors: (await import("./ar/errors.json")).default,
    validation: (await import("./ar/validation.json")).default,
    dashboard: (await import("./ar/dashboard.json")).default,
    survey: (await import("./ar/survey.json")).default,
    emails: (await import("./ar/emails.json")).default,
  }),
  en: async () => ({
    common: (await import("./en/common.json")).default,
    metadata: (await import("./en/metadata.json")).default,
    home: (await import("./en/home.json")).default,
    auth: (await import("./en/auth.json")).default,
    errors: (await import("./en/errors.json")).default,
    validation: (await import("./en/validation.json")).default,
    dashboard: (await import("./en/dashboard.json")).default,
    survey: (await import("./en/survey.json")).default,
    emails: (await import("./en/emails.json")).default,
  }),
} satisfies Record<Locale, () => Promise<unknown>>;

export type Messages = Awaited<ReturnType<(typeof load)["ar"]>>;

export const loadMessages = (locale: Locale): Promise<Messages> => load[locale]();
