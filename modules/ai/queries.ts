import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardFilters, Range } from "@/modules/analytics/period";
import { isTheme, type Theme } from "./taxonomy";

type InsightText = { headline: string; summary: string; actions: string[] };

/** The most recent weekly summary with the comments it's based on. */
export async function getLatestInsight(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ai_insights")
    .select("id, period_start, period_end, observed, interpretation, created_at")
    .eq("organization_id", organizationId)
    .eq("kind", "weekly_summary")
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const { data: evidence } = await supabase
    .from("ai_insight_evidence")
    .select("response:survey_responses!inner(id, comment_text, submitted_at)")
    .eq("insight_id", data.id);
  return {
    ...data,
    // Written only by modules/ai/jobs.ts after validation, so the shape is known.
    interpretation: data.interpretation as { ar: InsightText; en: InsightText },
    observed: data.observed as { comments: number },
    evidence: (evidence ?? []).flatMap((e) => (e.response ? [e.response] : [])),
  };
}

export type ThemeCounts = { analysed: number; praise: [Theme, number][]; complaints: [Theme, number][] };

const sorted = (counts: Record<string, number>) =>
  Object.entries(counts)
    .filter((entry): entry is [Theme, number] => isTheme(entry[0]))
    .sort((a, b) => b[1] - a[1]);

export async function getThemeCounts(organizationId: string, filters: DashboardFilters, range: Range): Promise<ThemeCounts> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_theme_counts", {
    p_organization_id: organizationId,
    p_from: range.from.toISOString(),
    p_to: range.to.toISOString(),
    p_location_id: filters.location ?? null,
    p_survey_id: filters.survey ?? null,
  });
  if (error) throw error;
  const counts = data as { analysed: number; praise: Record<string, number>; complaints: Record<string, number> };
  return { analysed: counts.analysed, praise: sorted(counts.praise), complaints: sorted(counts.complaints) };
}

/** Written comments from the last 90 days that haven't been analysed yet. */
export async function countPendingComments(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const [comments, analysed] = await Promise.all([
    supabase.from("survey_responses").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("has_comment", true).gte("submitted_at", since),
    supabase
      .from("response_analyses")
      .select("id, response:survey_responses!inner(submitted_at)", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("response.submitted_at", since),
  ]);
  return Math.max(0, (comments.count ?? 0) - (analysed.count ?? 0));
}
