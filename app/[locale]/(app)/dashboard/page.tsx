import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile } from "@/lib/auth/session";
import { formatCount, formatDate, formatNumber, formatPercent } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { resolveLocale } from "@/lib/i18n/server";
import { captureServerEvent } from "@/lib/observability/analytics";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AiInsightsSection } from "@/modules/ai/components/insights-section";
import { BarList, Meter, NpsBar } from "@/modules/analytics/components/breakdowns";
import { DailyChart, type DailyPoint } from "@/modules/analytics/components/daily-chart";
import { DashboardFilterBar } from "@/modules/analytics/components/dashboard-filters";
import { QuestionResults } from "@/modules/analytics/components/question-results";
import { StatTile, type Trend } from "@/modules/analytics/components/stat-tile";
import { averageRating, csatRatio, delta, npsScore, relativeChange } from "@/modules/analytics/metrics";
import { dashboardQuery, parseDashboardFilters, rangeFor, riyadhDate } from "@/modules/analytics/period";
import { getAnalytics, getPublishedDefinition, getQuestionStats } from "@/modules/analytics/queries";
import { getFilterOptions } from "@/modules/feedback/queries";
import { CreateSurveyButton } from "@/modules/surveys/components/create-survey-button";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("metaTitle") };
}

/** Rounds a chart's top up to a clean number and returns gridlines at 0, half and the top. */
function countTicks(locale: Locale, maxValue: number) {
  const step = maxValue <= 4 ? 2 : Math.pow(10, Math.floor(Math.log10(maxValue))) / 2;
  const max = Math.max(2, Math.ceil(maxValue / step) * step);
  return { max, ticks: [0, max / 2, max].map((value) => ({ value, label: formatNumber(locale, value, { maximumFractionDigits: 1 }) })) };
}

export default async function DashboardPage({ params, searchParams }: PageProps<"/[locale]/dashboard">) {
  const locale = await resolveLocale(params);
  const { user, membership } = await requireMembership(locale);
  const organizationId = membership.organization.id;
  const filters = parseDashboardFilters(await searchParams);
  const range = rangeFor(filters);
  const supabase = await createSupabaseServerClient();

  const [profile, t, surveyCount, options, analytics, definition, questionStats] = await Promise.all([
    getProfile(user.id),
    getTranslations({ locale, namespace: "dashboard" }),
    supabase
      .from("surveys")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .then((r) => r.count ?? 0),
    getFilterOptions(organizationId),
    getAnalytics(organizationId, filters, range),
    filters.survey ? getPublishedDefinition(organizationId, filters.survey) : null,
    filters.survey ? getQuestionStats(organizationId, filters.survey, filters, range) : null,
  ]);
  captureServerEvent("dashboard_viewed", user.id, { locale, organization_id: organizationId, period: filters.period });
  const name = profile?.full_name?.split(" ")[0];

  const header = (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{name ? t("welcome", { name }) : t("welcomeNoName")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
    </div>
  );

  if (surveyCount === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-start gap-4">
            <h2 className="text-xl font-bold">{t("createSurvey")}</h2>
            <p className="text-muted-foreground">{t("createSurveyBody")}</p>
            {can(membership.role, "surveys.manage") && <CreateSurveyButton label={t("createSurvey")} />}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { totals, previous } = analytics;
  const pct = (ratio: number | null) => (ratio === null ? t("kpi.noData") : formatPercent(locale, ratio, 0));
  const csat = csatRatio(totals);
  const nps = npsScore(totals);
  const signed = (value: number) => formatNumber(locale, Math.abs(value), { maximumFractionDigits: 0 });

  const trend = (change: number | null, format: (v: number) => string, upIsGood = true): Trend | null => {
    if (change === null) return null;
    const rounded = Math.round(change * 1000) / 1000;
    if (rounded === 0) return { direction: "same", label: t("kpi.same"), good: null };
    const up = rounded > 0;
    return { direction: up ? "up" : "down", label: t(up ? "kpi.up" : "kpi.down", { value: format(Math.abs(rounded)) }), good: up === upIsGood };
  };
  const responsesTrend = trend(relativeChange(totals.responses, previous.responses), (v) => formatPercent(locale, v, 0));
  const csatTrend = trend(delta(csat, csatRatio(previous)), (v) => t("kpi.points", { value: signed(v * 100) }));
  const npsTrend = trend(delta(nps, npsScore(previous)), (v) => t("kpi.points", { value: signed(v) }));
  const caption = (tr: Trend | null) => (tr ? t("kpi.vsPrevious") : t("kpi.noPrevious"));

  const dayLabel = (day: string) => formatDate(locale, `${day}T12:00:00+03:00`, { day: "numeric", month: "short" });
  const responseTicks = countTicks(locale, Math.max(...analytics.daily.map((d) => d.responses), 1));
  const responsePoints: DailyPoint[] = analytics.daily.map((d) => ({
    day: d.day,
    dayLabel: dayLabel(d.day),
    value: d.responses,
    valueLabel: t("charts.responsesValue", { count: formatCount(locale, d.responses) }),
  }));
  const csatPoints: DailyPoint[] = analytics.daily.map((d) => {
    const ratio = csatRatio(d);
    return {
      day: d.day,
      dayLabel: dayLabel(d.day),
      value: ratio === null ? null : ratio * 100,
      valueLabel: ratio === null ? t("charts.noRatings") : t("charts.csatValue", { percent: formatPercent(locale, ratio, 0) }),
    };
  });
  const percentTicks = [0, 50, 100].map((value) => ({ value, label: formatPercent(locale, value / 100, 0) }));

  const passives = totals.npsCount - totals.promoters - totals.detractors;
  const npsSegments = (
    [
      ["detractors", totals.detractors],
      ["passives", passives],
      ["promoters", totals.promoters],
    ] as const
  ).map(([key, count]) => {
    const share = totals.npsCount > 0 ? count / totals.npsCount : 0;
    return { key, label: t(`charts.${key}`), share, value: formatPercent(locale, share, 0) };
  });
  const maxRating = Math.max(...analytics.csatDistribution.map((d) => d.count), 1);
  const ratingRows = [...analytics.csatDistribution].reverse().map((d) => ({
    key: String(d.score),
    label: t("charts.ratingLabel", { score: formatCount(locale, d.score) }),
    share: d.count / maxRating,
    value: `${formatCount(locale, d.count)} · ${formatPercent(locale, totals.csatCount ? d.count / totals.csatCount : 0, 0)}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      {header}
      <DashboardFilterBar key={dashboardQuery(filters)} filters={filters} today={riyadhDate(new Date())} locations={options.locations} surveys={options.surveys} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("kpi.responses")} value={formatCount(locale, totals.responses)} trend={responsesTrend} trendCaption={caption(responsesTrend)} />
        <StatTile
          label={t("kpi.csat")}
          hint={t("kpi.csatHint")}
          value={pct(csat)}
          detail={csat === null ? undefined : t("kpi.csatAverage", { score: formatNumber(locale, averageRating(totals.csatSum, totals.csatCount) ?? 0, { maximumFractionDigits: 1 }) })}
          trend={csatTrend}
          trendCaption={caption(csatTrend)}
        />
        <StatTile
          label={t("kpi.nps")}
          hint={t("kpi.npsHint")}
          value={nps === null ? t("kpi.noData") : formatNumber(locale, nps, { signDisplay: "exceptZero" })}
          detail={nps === null ? undefined : t("kpi.npsBase", { count: formatCount(locale, totals.npsCount) })}
          trend={npsTrend}
          trendCaption={caption(npsTrend)}
        />
        <StatTile
          label={t("kpi.comments")}
          value={formatCount(locale, totals.comments)}
          detail={totals.responses ? t("kpi.commentsShare", { percent: formatPercent(locale, totals.comments / totals.responses, 0) }) : undefined}
          trendCaption=""
        />
      </section>

      {totals.responses === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4">
            <h2 className="text-xl font-bold">{t("empty.title")}</h2>
            <p className="text-muted-foreground">{t("empty.body")}</p>
            <Button asChild variant="outline">
              <Link href="/surveys">{t("empty.action")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-4 px-6">
              <h2 className="font-sans text-base font-semibold">{t("charts.responsesPerDay")}</h2>
              <DailyChart
                mode="columns"
                points={responsePoints}
                max={responseTicks.max}
                ticks={responseTicks.ticks}
                caption={t("charts.responsesPerDay")}
                dayHeader={t("charts.day")}
                valueHeader={t("charts.value")}
              />
            </Card>
            <Card className="gap-4 px-6">
              <div className="flex flex-col gap-1">
                <h2 className="font-sans text-base font-semibold">{t("charts.csatPerDay")}</h2>
                <p className="text-xs text-muted-foreground">{t("charts.csatPerDayHint")}</p>
              </div>
              <DailyChart
                mode="line"
                points={csatPoints}
                max={100}
                ticks={percentTicks}
                caption={t("charts.csatPerDay")}
                dayHeader={t("charts.day")}
                valueHeader={t("charts.value")}
              />
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-4 px-6">
              <h2 className="font-sans text-base font-semibold">{t("charts.npsBreakdown")}</h2>
              {totals.npsCount === 0 ? (
                <p className="text-sm text-muted-foreground">{t("charts.noNps")}</p>
              ) : (
                <NpsBar label={t("charts.npsBreakdown")} segments={npsSegments} />
              )}
            </Card>
            <Card className="gap-4 px-6">
              <h2 className="font-sans text-base font-semibold">{t("charts.csatDistribution")}</h2>
              {totals.csatCount === 0 ? <p className="text-sm text-muted-foreground">{t("charts.noCsat")}</p> : <BarList rows={ratingRows} />}
            </Card>
          </section>
        </>
      )}

      <AiInsightsSection locale={locale} organizationId={organizationId} filters={filters} range={range} canAnalyze={can(membership.role, "surveys.manage")} />

      <Card className="gap-0 p-0">
        <h2 className="px-6 pt-5 pb-3 font-sans text-base font-semibold">{t("locations.title")}</h2>
        {analytics.locations.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">{t("locations.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-border bg-sand-50 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-2.5 text-start font-medium">{t("locations.location")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">{t("locations.responses")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start font-medium">{t("locations.csat")}</th>
                  <th scope="col" className="px-6 py-2.5 text-end font-medium">{t("locations.nps")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.locations.map((loc) => {
                  const ratio = csatRatio(loc);
                  const score = npsScore(loc);
                  return (
                    <tr key={loc.id}>
                      <th scope="row" className="px-6 py-3 text-start font-semibold">{loc.name}</th>
                      <td className="px-3 py-3 text-end tabular">{formatCount(locale, loc.responses)}</td>
                      <td className="px-3 py-3">
                        {ratio === null ? (
                          <span className="text-muted-foreground">{t("kpi.noData")}</span>
                        ) : (
                          <span className="flex items-center gap-3">
                            <Meter ratio={ratio} label={formatPercent(locale, ratio, 0)} />
                            <span className="w-10 shrink-0 font-semibold tabular">{formatPercent(locale, ratio, 0)}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-end font-semibold tabular">
                        {score === null ? <span className="font-normal text-muted-foreground">{t("kpi.noData")}</span> : formatNumber(locale, score, { signDisplay: "exceptZero" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="gap-4 px-6">
        <h2 className="font-sans text-base font-semibold">{t("questions.title")}</h2>
        {definition && questionStats && filters.survey ? (
          <QuestionResults definition={definition} stats={questionStats} surveyId={filters.survey} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("questions.chooseSurvey")}</p>
        )}
      </Card>
    </div>
  );
}
