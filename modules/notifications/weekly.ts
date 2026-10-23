import "server-only";
import { getTranslations } from "next-intl/server";
import { formatCount, formatDate, formatNumber, formatPercent } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { reportError } from "@/lib/observability/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Stat } from "@/lib/email/templates/notification-email";
import { csatRatio, delta, npsScore, relativeChange } from "@/modules/analytics/metrics";
import { parseDashboardFilters, rangeFor } from "@/modules/analytics/period";
import type { Analytics } from "@/modules/analytics/queries";
import { appUrl, emailFrame, sendEach, type Recipient } from "./shared";

// Percentages inside Arabic sentences stay left-to-right ("92%", not "%92").
const isolate = (text: string) => `⁦${text}⁩`;

/**
 * The Sunday email: last week's numbers against the week before, the best and weakest branch,
 * unhappy customers still waiting, and the AI summary when there is one. Sent only to businesses
 * that had responses this week, to the members who want it.
 */
export async function sendWeeklyReports({ organizationId }: { organizationId?: string } = {}) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "notConfigured" as const };
  const range = rangeFor(parseDashboardFilters({ period: "7" }));
  const from = range.from.toISOString();
  const to = range.to.toISOString();

  let query = supabase.from("survey_responses").select("organization_id").gte("submitted_at", from).lt("submitted_at", to);
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data: rows, error } = await query;
  if (error) throw error;
  const organizations = [...new Set((rows ?? []).map((r) => r.organization_id))];

  let sent = 0;
  for (const org of organizations) {
    try {
      sent += await reportOne(supabase, org, range.from, range.to);
    } catch (e) {
      reportError(e, { area: "notifications", action: "weekly-report" });
    }
  }
  return { organizations: organizations.length, sent };
}

type Admin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

async function reportOne(supabase: Admin, organizationId: string, from: Date, to: Date): Promise<number> {
  const { data: recipients, error: recipientsError } = await supabase.rpc("notification_recipients", { p_organization_id: organizationId, p_kind: "weekly_report" });
  if (recipientsError) throw recipientsError;
  if (!recipients?.length) return 0;

  const [{ data: analyticsData, error }, { data: organization }, { count: openUnhappy }, { data: insight }] = await Promise.all([
    supabase.rpc("get_analytics", { p_organization_id: organizationId, p_from: from.toISOString(), p_to: to.toISOString() }),
    supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle(),
    supabase
      .from("survey_responses")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("rating_sentiment", "negative")
      .neq("status", "resolved"),
    supabase
      .from("ai_insights")
      .select("interpretation")
      .eq("organization_id", organizationId)
      .eq("kind", "weekly_summary")
      .gte("period_end", from.toISOString())
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error) throw error;
  const analytics = analyticsData as unknown as Analytics;
  const { totals, previous } = analytics;
  if (totals.responses === 0) return 0;
  const business = organization?.name ?? "";

  const rated = analytics.locations.filter((l) => l.csatCount > 0).map((l) => ({ name: l.name, ratio: csatRatio(l) ?? 0, count: l.csatCount }));
  rated.sort((a, b) => b.ratio - a.ratio || b.count - a.count);
  const top = rated[0];
  const lowest = rated.length > 1 ? rated[rated.length - 1] : undefined;
  const interpretation = insight?.interpretation as Record<Locale, { headline: string; summary: string }> | undefined;

  return sendEach(
    recipients as Recipient[],
    async ({ locale }) => {
      const t = await getTranslations({ locale, namespace: "emails.weeklyReport" });
      const frame = await emailFrame(locale, business);
      // Inside sentences, isolated; alone in a table cell, plain (some mail apps show the marks as boxes).
      const pct = (ratio: number) => isolate(formatPercent(locale, ratio, 0));
      const plainPct = (ratio: number) => formatPercent(locale, ratio, 0);
      const signed = (value: number) => formatNumber(locale, Math.abs(value), { maximumFractionDigits: 0 });
      const change = (value: number | null, format: (v: number) => string, upIsGood = true): Stat["change"] => {
        if (value === null) return undefined;
        const rounded = Math.round(value * 1000) / 1000;
        if (rounded === 0) return { text: t("same"), tone: "neutral" };
        const up = rounded > 0;
        return { text: t(up ? "up" : "down", { value: format(Math.abs(rounded)) }), tone: up === upIsGood ? "good" : "bad" };
      };

      const csat = csatRatio(totals);
      const nps = npsScore(totals);
      const stats: Stat[] = [
        { label: t("responses"), value: formatCount(locale, totals.responses), change: change(relativeChange(totals.responses, previous.responses), (v) => plainPct(v)) },
      ];
      if (csat !== null) stats.push({ label: t("csat"), value: plainPct(csat), change: change(delta(csat, csatRatio(previous)), (v) => t("points", { value: signed(v * 100) })) });
      if (nps !== null)
        stats.push({
          label: t("nps"),
          value: formatNumber(locale, nps, { signDisplay: "exceptZero" }),
          change: change(delta(nps, npsScore(previous)), (v) => t("points", { value: signed(v) })),
        });
      stats.push({ label: t("comments"), value: formatCount(locale, totals.comments) });
      stats.push({ label: t("openUnhappy"), value: formatCount(locale, openUnhappy ?? 0) });

      const lines = [t("intro")];
      if (top) lines.push(t("topBranch", { name: top.name, percent: pct(top.ratio) }));
      if (lowest) lines.push(t("lowestBranch", { name: lowest.name, percent: pct(lowest.ratio) }));
      const summary = interpretation?.[locale];
      const lastDay = new Date(to.getTime() - 1);

      return {
        subject: t("subject", { business, count: formatCount(locale, totals.responses) }),
        props: {
          locale,
          appName: frame.appName,
          eyebrow: t("eyebrow", { from: formatDate(locale, from, { day: "numeric", month: "short" }), to: formatDate(locale, lastDay, { day: "numeric", month: "short" }) }),
          heading: t("heading", { business }),
          tone: "report",
          lines,
          stats,
          quote: summary ? { label: t("aiLabel"), text: `${summary.headline}. ${summary.summary}` } : undefined,
          action: { label: t("button"), url: appUrl(locale, "/dashboard") },
          footer: frame.footer,
        },
      };
    },
    "weekly-report",
  );
}
