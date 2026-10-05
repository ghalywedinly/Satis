import "server-only";
import { cache } from "react";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadMessages } from "@/locales";
import type { LocalizedText, Question, SurveyDraft } from "./definition";
import type { SurveyLabels } from "./components/survey-form";

/** A survey of the given business (RLS also guarantees the caller belongs to it). */
export const getSurvey = cache(async (organizationId: string, surveyId: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(surveyId)) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("surveys")
    .select("id, name, status, default_locale, locales, questions, thank_you, current_version_id, has_unpublished_changes")
    .eq("id", surveyId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  return data;
});

export type SurveyRow = NonNullable<Awaited<ReturnType<typeof getSurvey>>>;

/** Rows are written only through validated actions, so their JSON matches the draft shape. */
export const toDraft = (survey: SurveyRow): SurveyDraft => ({
  name: survey.name,
  locales: survey.locales,
  defaultLocale: survey.default_locale,
  questions: survey.questions as Question[],
  thankYou: survey.thank_you as LocalizedText,
});

/** Customer-facing survey text in both languages, for previews in any language. */
export async function surveyLabels(): Promise<Record<Locale, SurveyLabels>> {
  const [ar, en] = await Promise.all([loadMessages("ar"), loadMessages("en")]);
  return { ar: ar.publicSurvey, en: en.publicSurvey };
}
