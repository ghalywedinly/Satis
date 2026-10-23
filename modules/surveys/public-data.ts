import "server-only";
import { cache } from "react";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import type { SurveyDefinition } from "./definition";

export type PublicSurvey = {
  linkId: string;
  organizationName: string;
  locationName: string;
  versionId: string;
  definition: SurveyDefinition;
};

/** The live survey behind a public code, or null when it doesn't exist or isn't accepting answers. */
export const getPublicSurvey = cache(async (code: string): Promise<PublicSurvey | null> => {
  if (!/^[A-Za-z0-9]{8,16}$/.test(code)) return null;
  const supabase = createSupabaseAnonClient();
  if (!supabase) return null;
  const { data } = await supabase.rpc("get_public_survey", { p_code: code });
  return (data as PublicSurvey | null) ?? null;
});

/** /s/{code} shows the survey's default language; /s/{code}/{lang} another of its languages. */
export function resolveSurveyLocale(survey: PublicSurvey | null, lang: string[] | undefined): Locale | null {
  const requested = lang?.[0];
  if (lang && lang.length > 1) return null;
  if (!survey) return requested === "en" ? "en" : "ar";
  if (!requested) return survey.definition.defaultLocale;
  return survey.definition.locales.includes(requested as Locale) ? (requested as Locale) : null;
}
