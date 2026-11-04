"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
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

  try {
    const analysis = await analyzePending({ organizationId, limit: 80 });
    if ("error" in analysis) return { error: "aiNotConfigured" };
    const summary = await generateWeeklySummaries({ organizationId });
    captureServerEvent("ai_analysis_requested", user.id, { organization_id: organizationId, analysed: analysis.analysed });
    refresh();
    return { analysed: analysis.analysed, summarised: "created" in summary && summary.created > 0 };
  } catch (error) {
    reportError(error, { area: "ai", action: "analyze-now" });
    return { error: "generic" };
  }
}
