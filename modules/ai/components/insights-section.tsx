import { MessageSquareQuote, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { isAIConfigured } from "@/lib/ai/provider";
import { formatCount, formatDate } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { BarList } from "@/modules/analytics/components/breakdowns";
import type { DashboardFilters, Range } from "@/modules/analytics/period";
import { countPendingComments, getLatestInsight, getThemeCounts } from "../queries";
import { AnalyzeNowButton } from "./analyze-now";

/** Minimum analysed comments for a weekly summary (see modules/ai/jobs.ts). */
const MIN_COMMENTS = 3;

/**
 * The dashboard's AI section: this week's summary (clearly labelled as AI, with the comments it
 * rests on) and how often each theme was praised or complained about in the selected period.
 */
export async function AiInsightsSection({
  locale,
  organizationId,
  filters,
  range,
  canAnalyze,
}: {
  locale: Locale;
  organizationId: string;
  filters: DashboardFilters;
  range: Range;
  canAnalyze: boolean;
}) {
  const [t, tThemes, insight, themes, pending] = await Promise.all([
    getTranslations({ locale, namespace: "ai" }),
    getTranslations({ locale, namespace: "ai.themes" }),
    getLatestInsight(organizationId),
    getThemeCounts(organizationId, filters, range),
    countPendingComments(organizationId),
  ]);
  const configured = isAIConfigured();
  const text = insight?.interpretation[locale];
  const share = (count: number) => formatCount(locale, count);
  const bars = (rows: [string, number][]) => {
    const max = Math.max(...rows.map(([, n]) => n), 1);
    return rows.slice(0, 6).map(([theme, n]) => ({ key: theme, label: tThemes(theme as never), share: n / max, value: share(n) }));
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card className="relative gap-4 overflow-hidden px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
            <Sparkles aria-hidden strokeWidth={1.75} className="size-4 text-grape-500" />
            {t("insights.title")}
          </h2>
          <span className="rounded-full bg-grape-50 px-2.5 py-1 text-xs font-semibold text-grape-600">{t("label")}</span>
        </div>
        {insight && text ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              {t("insights.period", { from: formatDate(locale, insight.period_start, { day: "numeric", month: "short" }), to: formatDate(locale, new Date(new Date(insight.period_end).getTime() - 1), { day: "numeric", month: "short" }) })}
              {" · "}
              {t("insights.basedOn", { count: share(insight.observed.comments) })}
            </p>
            <p className="font-display text-xl leading-snug font-extrabold">{text.headline}</p>
            <p className="leading-relaxed text-ink-700">{text.summary}</p>
            {text.actions.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="font-sans text-sm font-semibold">{t("insights.actions")}</h3>
                <ul className="flex flex-col gap-1.5">
                  {text.actions.map((action) => (
                    <li key={action} className="flex gap-2 text-sm">
                      <span aria-hidden className="slice-sm mt-1.5 h-2 w-3 shrink-0 bg-ultramarine" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insight.evidence.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <h3 className="font-sans text-sm font-semibold">{t("insights.evidence")}</h3>
                <ul className="flex flex-col gap-2">
                  {insight.evidence.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/inbox/${e.id}`}
                        className="flex gap-2 rounded-[12px] bg-sand-50 px-3 py-2 text-sm outline-none hover:bg-sand-100 focus-visible:shadow-focus"
                        aria-label={`${t("insights.openComment")}: ${e.comment_text ?? ""}`}
                      >
                        <MessageSquareQuote aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span dir="auto" className="line-clamp-2 text-start">
                          {e.comment_text}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{configured ? t("insights.empty", { min: formatCount(locale, MIN_COMMENTS) }) : t("insights.notConfigured")}</p>
        )}
        {configured && canAnalyze && pending > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">{t("insights.pending", { count: share(pending) })}</p>
            <AnalyzeNowButton />
          </div>
        )}
      </Card>

      <Card className="gap-4 px-6">
        <h2 className="font-sans text-base font-semibold">{t("insights.themesTitle")}</h2>
        {themes.analysed === 0 ? (
          <p className="text-sm text-muted-foreground">{t("insights.noAnalysed")}</p>
        ) : (
          <>
            {themes.complaints.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="font-sans text-sm font-semibold text-ember-700">{t("insights.complaints")}</h3>
                <BarList rows={bars(themes.complaints)} />
              </div>
            )}
            {themes.praise.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="font-sans text-sm font-semibold text-mint-700">{t("insights.praise")}</h3>
                <BarList rows={bars(themes.praise)} />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{t("insights.basedOn", { count: share(themes.analysed) })}</p>
          </>
        )}
      </Card>
    </section>
  );
}
