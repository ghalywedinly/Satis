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
    emails: (await import("./ar/emails.json")).default,
    organization: (await import("./ar/organization.json")).default,
    onboarding: (await import("./ar/onboarding.json")).default,
    locations: (await import("./ar/locations.json")).default,
    team: (await import("./ar/team.json")).default,
    invite: (await import("./ar/invite.json")).default,
    settings: (await import("./ar/settings.json")).default,
    surveys: (await import("./ar/surveys.json")).default,
    publicSurvey: (await import("./ar/publicSurvey.json")).default,
    surveyTemplate: (await import("./ar/surveyTemplate.json")).default,
    inbox: (await import("./ar/inbox.json")).default,
  }),
  en: async () => ({
    common: (await import("./en/common.json")).default,
    metadata: (await import("./en/metadata.json")).default,
    home: (await import("./en/home.json")).default,
    auth: (await import("./en/auth.json")).default,
    errors: (await import("./en/errors.json")).default,
    validation: (await import("./en/validation.json")).default,
    dashboard: (await import("./en/dashboard.json")).default,
    emails: (await import("./en/emails.json")).default,
    organization: (await import("./en/organization.json")).default,
    onboarding: (await import("./en/onboarding.json")).default,
    locations: (await import("./en/locations.json")).default,
    team: (await import("./en/team.json")).default,
    invite: (await import("./en/invite.json")).default,
    settings: (await import("./en/settings.json")).default,
    surveys: (await import("./en/surveys.json")).default,
    publicSurvey: (await import("./en/publicSurvey.json")).default,
    surveyTemplate: (await import("./en/surveyTemplate.json")).default,
    inbox: (await import("./en/inbox.json")).default,
  }),
} satisfies Record<Locale, () => Promise<unknown>>;

export type Messages = Awaited<ReturnType<(typeof load)["ar"]>>;

export const loadMessages = (locale: Locale): Promise<Messages> => load[locale]();
