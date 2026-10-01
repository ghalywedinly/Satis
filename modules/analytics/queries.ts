import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SurveyDefinition } from "@/modules/surveys/definition";
import type { DashboardFilters, Range } from "./period";

type Counts = { csatCount: number; csatSatisfied: number; npsCount: number; promoters: number; detractors: number };

/** Shape of get_analytics (supabase/migrations/20261001180000_analytics.sql). */
export type Analytics = {
  totals: Counts & { responses: number; comments: number; csatSum: number };
  previous: Counts & { responses: number };
  daily: { day: string; responses: number; csatCount: number; csatSatisfied: number }[];
  csatDistribution: { score: number; count: number }[];
  locations: (Counts & { id: string; name: string; responses: number })[];
};

/** Shape of get_question_stats: results per question id. */
export type QuestionStats = Record<string, { answers: number; average: number | null; numbers: Record<string, number>; options: Record<string, number> }>;

export async function getAnalytics(organizationId: string, filters: DashboardFilters, range: Range): Promise<Analytics> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_analytics", {
    p_organization_id: organizationId,
    p_from: range.from.toISOString(),
    p_to: range.to.toISOString(),
    p_location_id: filters.location ?? null,
    p_survey_id: filters.survey ?? null,
  });
  if (error) throw error;
  return data as unknown as Analytics;
}

export async function getQuestionStats(organizationId: string, surveyId: string, filters: DashboardFilters, range: Range): Promise<QuestionStats> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_question_stats", {
    p_organization_id: organizationId,
    p_survey_id: surveyId,
    p_from: range.from.toISOString(),
    p_to: range.to.toISOString(),
    p_location_id: filters.location ?? null,
  });
  if (error) throw error;
  return data as unknown as QuestionStats;
}

/** The live version of a survey (question titles and options for per-question results). */
export async function getPublishedDefinition(organizationId: string, surveyId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: survey } = await supabase
    .from("surveys")
    .select("current_version_id")
    .eq("id", surveyId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!survey?.current_version_id) return null;
  const { data } = await supabase.from("survey_versions").select("definition").eq("id", survey.current_version_id).maybeSingle();
  // Versions are frozen by publish_survey, so their JSON matches the definition shape.
  return (data?.definition ?? null) as SurveyDefinition | null;
}
