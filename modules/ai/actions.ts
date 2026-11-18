"use server";

import { randomUUID } from "node:crypto";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { refresh } from "next/cache";
import { after } from "next/server";
import { flushPostHogLogs, getPostHogLogger } from "@/instrumentation";
import { requireUser } from "@/lib/auth/session";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent, flushPostHog } from "@/lib/observability/analytics";
import { reportError } from "@/lib/observability/errors";
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

  const observability = { sessionId: `manual-ai-analysis:${randomUUID()}`, distinctId: user.id };
  const logger = getPostHogLogger();
  logger?.emit({ body: "Manual AI analysis started", severityNumber: SeverityNumber.INFO, attributes: { operation: "manual_ai_analysis" } });
  try {
    const analysis = await analyzePending({ organizationId, limit: 80, observability });
    if ("error" in analysis) {
      logger?.emit({ body: "Manual AI analysis skipped because AI is unavailable", severityNumber: SeverityNumber.WARN, attributes: { operation: "manual_ai_analysis" } });
      return { error: "aiNotConfigured" };
    }
    const summary = await generateWeeklySummaries({ organizationId, observability });
    const summarised = "created" in summary && summary.created > 0;
    logger?.emit({ body: "Manual AI analysis completed", severityNumber: SeverityNumber.INFO, attributes: { operation: "manual_ai_analysis", analysed: analysis.analysed, summarised } });
    captureServerEvent("ai_analysis_requested", user.id, { organization_id: organizationId, analysed: analysis.analysed });
    refresh();
    return { analysed: analysis.analysed, summarised };
  } catch (error) {
    logger?.emit({ body: "Manual AI analysis failed", severityNumber: SeverityNumber.ERROR, attributes: { operation: "manual_ai_analysis" } });
    reportError(error, { area: "ai", action: "analyze-now" });
    return { error: "generic" };
  } finally {
    // Server Actions may finish immediately after the model response; never fail the action if delivery fails.
    await flushPostHog();
    after(flushPostHogLogs);
  }
}
