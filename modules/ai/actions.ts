"use server";

import { SeverityNumber } from "@opentelemetry/api-logs";
import { refresh } from "next/cache";
import { createAIObservabilityContext } from "@/lib/ai/provider";
import { requireUser } from "@/lib/auth/session";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent, flushPostHog } from "@/lib/observability/analytics";
import { reportError } from "@/lib/observability/errors";
import { emitPostHogLog, flushPostHogLogs } from "@/lib/observability/posthog-logs";
import { getActiveMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { consumeRateLimit } from "@/lib/rate-limit";
import { analyzePending, generateWeeklySummaries } from "./jobs";

export type AnalyzeNowResult = { error: ErrorKey } | { analysed: number; summarised: boolean };

/**
 * Managers: analyse this business's new comments and refresh this week's summary now, instead
 * of waiting for the nightly run. Limited per business because it calls a paid AI service.
 */
export async function analyzeNow(locale: Locale): Promise<AnalyzeNowResult> {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, "surveys.manage")) return { error: "forbidden" };
  const organizationId = membership.organization.id;
  if (!(await consumeRateLimit("aiManual", organizationId))) return { error: "rateLimited" };

  try {
    const observability = createAIObservabilityContext(user.id);
    const analysis = await analyzePending({ organizationId, limit: 80, observability });
    if ("error" in analysis) return { error: "aiNotConfigured" };
    const summary = await generateWeeklySummaries({ organizationId, observability });
    const summarised = "created" in summary && summary.created > 0;
    captureServerEvent("ai_analysis_requested", user.id, { organization_id: organizationId, analysed: analysis.analysed });
    emitPostHogLog("ai analysis request completed", SeverityNumber.INFO, {
      event: "ai_analysis.completed",
      organization_id: organizationId,
      analysed_count: analysis.analysed,
      summary_created: summarised,
      posthogDistinctId: user.id,
    });
    refresh();
    return { analysed: analysis.analysed, summarised };
  } catch (error) {
    reportError(error, { area: "ai", action: "analyze-now" });
    emitPostHogLog("ai analysis request failed", SeverityNumber.ERROR, {
      event: "ai_analysis.failed",
      organization_id: organizationId,
      error_type: error instanceof Error ? error.name : "unknown",
      posthogDistinctId: user.id,
    });
    return { error: "generic" };
  } finally {
    await Promise.all([flushPostHog(), flushPostHogLogs()]);
  }
}
