import "server-only";
import { redactForAI } from "@/lib/ai/redact";
import { AIOutputError, getAIProvider } from "@/lib/ai/provider";
import { reportError } from "@/lib/observability/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseDashboardFilters, rangeFor } from "@/modules/analytics/period";
import { analysisSchema, analyzePrompt, ANALYZE_SYSTEM, checkSummary, PROMPT_VERSION, summaryPrompt, SUMMARY_SYSTEM, summarySchema } from "./prompts";

/**
 * Background AI work. Runs from Vercel Cron (/api/cron/*) for every business, or on demand
 * for one business after the caller has been authorized. Uses the service-role client: the
 * functions it calls are server-only, and every write is scoped to the rows it read.
 */

const BATCH = 40;

export type AnalyzeResult = { analysed: number; failed: number } | { error: "notConfigured" };

/** Analyses written comments that haven't been analysed yet, in batches. */
export async function analyzePending({ organizationId, limit = 200 }: { organizationId?: string; limit?: number } = {}): Promise<AnalyzeResult> {
  const provider = await getAIProvider();
  const supabase = createSupabaseAdminClient();
  if (!provider || !supabase) return { error: "notConfigured" };

  let analysed = 0;
  let failed = 0;
  while (analysed + failed < limit) {
    const { data: pending, error } = await supabase.rpc("ai_pending_comments", { p_organization_id: organizationId ?? null, p_limit: Math.min(BATCH, limit - analysed - failed) });
    if (error) throw error;
    if (!pending?.length) break;
    try {
      const { data, model } = await provider.generate({
        task: "analyze_comments",
        system: ANALYZE_SYSTEM,
        prompt: analyzePrompt(pending.map((p) => redactForAI(p.comment_text))),
        schema: analysisSchema,
        effort: "low",
        maxTokens: 8000,
      });
      const rows = data.results
        .filter((r) => r.index >= 0 && r.index < pending.length)
        .map((r) => ({
          organization_id: pending[r.index].organization_id,
          response_id: pending[r.index].id,
          sentiment: r.sentiment,
          praise_themes: [...new Set(r.praise)],
          complaint_themes: [...new Set(r.complaints)],
          language: r.language,
          model,
          prompt_version: PROMPT_VERSION,
        }));
      const { error: insertError } = await supabase.from("response_analyses").upsert(rows, { onConflict: "response_id", ignoreDuplicates: true });
      if (insertError) throw insertError;
      analysed += rows.length;
      // Comments the model skipped stay pending; stop rather than loop on them.
      if (rows.length < pending.length) {
        failed += pending.length - rows.length;
        break;
      }
    } catch (e) {
      reportError(e, { area: "ai", action: "analyze" });
      failed += pending.length;
      if (!(e instanceof AIOutputError)) break;
    }
  }
  return { analysed, failed };
}

export type SummaryResult = { created: number; skipped: number } | { error: "notConfigured" };

/** Writes the weekly summary (last 7 Saudi days) for one business, or every business with comments. */
export async function generateWeeklySummaries({ organizationId }: { organizationId?: string } = {}): Promise<SummaryResult> {
  const provider = await getAIProvider();
  const supabase = createSupabaseAdminClient();
  if (!provider || !supabase) return { error: "notConfigured" };

  const range = rangeFor(parseDashboardFilters({ period: "7" }));
  const from = range.from.toISOString();
  const to = range.to.toISOString();

  // Businesses with analysed comments this week.
  let query = supabase
    .from("response_analyses")
    .select("organization_id, response:survey_responses!inner(submitted_at)")
    .gte("response.submitted_at", from)
    .lt("response.submitted_at", to);
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data: rows, error } = await query;
  if (error) throw error;
  const organizations = [...new Set((rows ?? []).map((r) => r.organization_id))];

  let created = 0;
  let skipped = 0;
  for (const org of organizations) {
    try {
      const ok = await summarizeOne(provider, supabase, org, from, to);
      if (ok) created += 1;
      else skipped += 1;
    } catch (e) {
      reportError(e, { area: "ai", action: "weekly-summary" });
      skipped += 1;
    }
  }
  return { created, skipped };
}

type Admin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type Provider = NonNullable<Awaited<ReturnType<typeof getAIProvider>>>;

async function summarizeOne(provider: Provider, supabase: Admin, organizationId: string, from: string, to: string): Promise<boolean> {
  const { data: observed, error } = await supabase.rpc("ai_weekly_observed", { p_organization_id: organizationId, p_from: from, p_to: to });
  if (error) throw error;
  const facts = observed as { comments: number };
  // Too little to say anything meaningful.
  if (!facts || facts.comments < 3) return false;

  // Up to 30 of the week's comments, complaints first: they matter most to the owner.
  const { data: sample, error: sampleError } = await supabase
    .from("response_analyses")
    .select("response_id, complaint_themes, response:survey_responses!inner(comment_text, submitted_at)")
    .eq("organization_id", organizationId)
    .gte("response.submitted_at", from)
    .lt("response.submitted_at", to)
    .order("analyzed_at", { ascending: false })
    .limit(100);
  if (sampleError) throw sampleError;
  const comments = (sample ?? [])
    .filter((s) => s.response?.comment_text)
    .sort((a, b) => b.complaint_themes.length - a.complaint_themes.length)
    .slice(0, 30);
  if (comments.length === 0) return false;

  const generate = () =>
    provider.generate({
      task: "weekly_summary",
      system: SUMMARY_SYSTEM,
      prompt: summaryPrompt(observed, comments.map((c) => redactForAI(c.response!.comment_text!))),
      schema: summarySchema,
      effort: "medium",
      maxTokens: 6000,
    });
  // One retry when the first draft cites numbers the data doesn't contain or has no evidence.
  let result = await generate();
  let evidence = checkSummary(result.data, observed, comments.length);
  if (!evidence) {
    result = await generate();
    evidence = checkSummary(result.data, observed, comments.length);
  }
  if (!evidence) return false;

  // Regenerating the same week replaces the previous summary (its evidence goes with it).
  await supabase.from("ai_insights").delete().eq("organization_id", organizationId).eq("kind", "weekly_summary").eq("period_start", from);
  const { data: insight, error: insertError } = await supabase
    .from("ai_insights")
    .insert({
      organization_id: organizationId,
      kind: "weekly_summary",
      period_start: from,
      period_end: to,
      observed,
      interpretation: { ar: result.data.ar, en: result.data.en },
      model: result.model,
      prompt_version: PROMPT_VERSION,
    })
    .select("id")
    .single();
  if (insertError || !insight) throw insertError;
  const { error: evidenceError } = await supabase
    .from("ai_insight_evidence")
    .insert(evidence.map((i) => ({ organization_id: organizationId, insight_id: insight.id, response_id: comments[i].response_id })));
  if (evidenceError) {
    // An insight without its evidence must not be shown.
    await supabase.from("ai_insights").delete().eq("id", insight.id);
    throw evidenceError;
  }
  return true;
}
