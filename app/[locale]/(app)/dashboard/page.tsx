import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BarChart3, Inbox, ListChecks, MapPin, Megaphone, MessageSquareQuote, MessageSquareText, Smile, Star, TrendingUp, type LucideIcon } from "lucide-react";
import { AlertIllustration, FeedbackFlowIllustration, PodiumIllustration, ShareSurveyIllustration } from "@/components/brand/illustrations";
import { SliceHighlight } from "@/components/brand/slice";
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
import { cn } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AiInsightsSection } from "@/modules/ai/components/insights-section";
import { BarList, Meter, NpsBar } from "@/modules/analytics/components/breakdowns";
import { DailyChart, type DailyPoint } from "@/modules/analytics/components/daily-chart";
import { DashboardFilterBar } from "@/modules/analytics/components/dashboard-filters";
import { QuestionResults } from "@/modules/analytics/components/question-results";
import { MiniBars, MiniRing, StatTile, type Trend } from "@/modules/analytics/components/stat-tile";
import { averageRating, csatRatio, delta, npsScore, relativeChange } from "@/modules/analytics/metrics";
import { dashboardQuery, parseDashboardFilters, rangeFor, riyadhDate } from "@/modules/analytics/period";
import { getAnalytics, getPublishedDefinition, getQuestionStats } from "@/modules/analytics/queries";
import { countUnread, getFilterOptions } from "@/modules/feedback/queries";
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

  const [profile, t, surveyCount, options, analytics, definition, questionStats, unread, openNegative] = await Promise.all([
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
    countUnread(organizationId),
    supabase
      .from("survey_responses")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("rating_sentiment", "negative")
      .neq("status", "resolved")
      .then((r) => r.count ?? 0),
  ]);
  captureServerEvent("dashboard_viewed", user.id, { locale, organization_id: organizationId, period: filters.period });
  const name = profile?.full_name?.split(" ")[0];

  const header = (
    <div className="relative overflow-hidden rounded-dialog bg-ink p-6 text-sand sm:p-8">
      <div className="relative grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm font-semibold text-ink-300">{t("hero.today", { date: formatDate(locale, new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" }) })}</p>
          <h1 className="text-3xl font-extrabold text-sand sm:text-5xl">
            {name ? t.rich("welcome", { name, hl: (chunks) => <SliceHighlight tone="ultra">{chunks}</SliceHighlight> }) : t("welcomeNoName")}
          </h1>
          <p className="max-w-md text-ink-300">{t("subtitle")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href="/inbox">
                <MessageSquareText aria-hidden strokeWidth={1.75} />
                {t("hero.openInbox")}
              </Link>
            </Button>
            <Button asChild variant="ghost" className="text-sand hover:bg-ink-700">
              <Link href="/surveys">{t("hero.manageSurveys")}</Link>
            </Button>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-600 px-3 py-1.5 text-xs font-semibold text-ink-200">
              <span aria-hidden className={cn("size-2 rounded-full", unread > 0 ? "bg-ember motion-safe:animate-pulse" : "bg-mint-500")} />
              {unread > 0 ? t("hero.unread", { count: formatCount(locale, unread) }) : t("hero.allRead")}
            </span>
          </div>
        </div>
        <FeedbackFlowIllustration className="hidden h-48 w-auto md:block lg:h-52" />
      </div>
    </div>
  );

  const chipTones = { ultra: "bg-ultra-50 text-ultramarine", mint: "bg-mint-50 text-mint-700", grape: "bg-grape-50 text-grape-600", ember: "bg-ember-50 text-ember-700" } as const;
  const cardTitle = (label: string, Icon: LucideIcon, tone: keyof typeof chipTones) => (
    <h2 className="flex items-center gap-2.5 font-sans text-base font-semibold">
      <span aria-hidden className={cn("slice-sm flex h-7 w-9 shrink-0 items-center justify-center", chipTones[tone])}>
        <Icon strokeWidth={1.75} className="size-4" />
      </span>
      {label}
    </h2>
  );

  const sectionLabel = (label: string) => (
    <div className="flex items-center gap-2.5 pt-2">
      <span aria-hidden className="slice-sm h-3 w-6 bg-ultramarine" />
      <h2 className="eyebrow font-sans">{label}</h2>
    </div>
  );

  if (surveyCount === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-start gap-4">
              <h2 className="text-2xl font-bold">{t("createSurvey")}</h2>
              <p className="max-w-md text-muted-foreground">{t("createSurveyBody")}</p>
              {can(membership.role, "surveys.manage") && <CreateSurveyButton label={t("createSurvey")} />}
            </div>
            <ShareSurveyIllustration className="h-44 w-auto shrink-0" />
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

  // Highlights: the branch customers like most, and the one (if several) they like least.
  const rated = analytics.locations.filter((l) => l.csatCount > 0).map((l) => ({ ...l, ratio: csatRatio(l) ?? 0 }));
  rated.sort((a, b) => b.ratio - a.ratio || b.csatCount - a.csatCount);
  const top = rated[0];
  const topRatio = top ? top.ratio : null;
  const lowest = rated.length > 1 ? rated[rated.length - 1] : undefined;
  const lowestRatio = lowest ? lowest.ratio : null;
  // Percentages inside Arabic sentences stay left-to-right ("92%", not "%92").
  const isolate = (text: string) => `\u2066${text}\u2069`;

  return (
    <div className="flex flex-col gap-6">
      {header}
      <DashboardFilterBar key={dashboardQuery(filters)} filters={filters} today={riyadhDate(new Date())} locations={options.locations} surveys={options.surveys} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t("kpi.responses")}
          value={formatCount(locale, totals.responses)}
          trend={responsesTrend}
          trendCaption={caption(responsesTrend)}
          icon={Inbox}
          tone="ultra"
          visual={analytics.daily.length > 1 ? <MiniBars values={analytics.daily.map((d) => d.responses)} onColor /> : undefined}
        />
        <StatTile
          label={t("kpi.csat")}
          hint={t("kpi.csatHint")}
          value={pct(csat)}
          detail={csat === null ? undefined : t("kpi.csatAverage", { score: formatNumber(locale, averageRating(totals.csatSum, totals.csatCount) ?? 0, { maximumFractionDigits: 1 }) })}
          trend={csatTrend}
          trendCaption={caption(csatTrend)}
          icon={Smile}
          visual={csat === null ? undefined : <MiniRing ratio={csat} tone="mint" />}
        />
        <StatTile
          label={t("kpi.nps")}
          hint={t("kpi.npsHint")}
          value={nps === null ? t("kpi.noData") : formatNumber(locale, nps, { signDisplay: "exceptZero" })}
          detail={nps === null ? undefined : t("kpi.npsBase", { count: formatCount(locale, totals.npsCount) })}
          trend={npsTrend}
          trendCaption={caption(npsTrend)}
          icon={Megaphone}
          tone="ink"
          visual={totals.npsCount ? <MiniRing ratio={totals.promoters / totals.npsCount} tone="sand" /> : undefined}
        />
        <StatTile
          label={t("kpi.comments")}
          value={formatCount(locale, totals.comments)}
          detail={totals.responses ? t("kpi.commentsShare", { percent: formatPercent(locale, totals.comments / totals.responses, 0) }) : undefined}
          trendCaption=""
          icon={MessageSquareQuote}
          tone="ember"
          visual={totals.responses ? <MiniRing ratio={totals.comments / totals.responses} tone="ink" /> : undefined}
        />
      </section>

      {totals.responses > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          {top && topRatio !== null && (
            <div className="relative isolate flex items-center justify-between gap-4 overflow-hidden rounded-card bg-zest p-6 text-ink">
              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-sm font-semibold">{t("highlights.top")}</p>
                <p className="truncate font-display text-3xl font-extrabold">{top.name}</p>
                <p className="text-sm text-ink-700">{t("highlights.topDetail", { percent: isolate(formatPercent(locale, topRatio, 0)), count: formatCount(locale, top.csatCount) })}</p>
              </div>
              <PodiumIllustration className="hidden h-28 w-auto shrink-0 sm:block" />
            </div>
          )}
          <div className="relative isolate flex items-center justify-between gap-4 overflow-hidden rounded-card border border-ember-200 bg-ember-50 p-6 text-ink">
            <div className="flex min-w-0 flex-col items-start gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-ember-700">
                <span aria-hidden className="slice-sm h-3 w-5 bg-ember" />
                {t("highlights.attention")}
              </p>
              <p className="font-display text-xl font-bold">
                {openNegative > 0 ? t("highlights.open", { count: formatCount(locale, openNegative) }) : t("highlights.noneOpen")}
              </p>
              {lowest && lowestRatio !== null && (
                <p className="text-sm text-ink-700">{t("highlights.lowest", { name: lowest.name, percent: isolate(formatPercent(locale, lowestRatio, 0)) })}</p>
              )}
              {openNegative > 0 && (
                <Button asChild size="sm" className="mt-1">
                  <Link href="/inbox?sentiment=negative">{t("highlights.action")}</Link>
                </Button>
              )}
            </div>
            <AlertIllustration className="hidden h-28 w-auto shrink-0 sm:block" />
          </div>
        </section>
      )}

      {totals.responses === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-start gap-4">
              <h2 className="text-xl font-bold">{t("empty.title")}</h2>
              <p className="max-w-md text-muted-foreground">{t("empty.body")}</p>
              <Button asChild variant="outline">
                <Link href="/surveys">{t("empty.action")}</Link>
              </Button>
            </div>
            <ShareSurveyIllustration className="h-40 w-auto shrink-0" />
          </CardContent>
        </Card>
      ) : (
        <>
          {sectionLabel(t("sections.trends"))}
          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-4 px-6">
              {cardTitle(t("charts.responsesPerDay"), BarChart3, "ultra")}
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
                {cardTitle(t("charts.csatPerDay"), TrendingUp, "mint")}
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

          {sectionLabel(t("sections.breakdown"))}
          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-4 px-6">
              {cardTitle(t("charts.npsBreakdown"), Megaphone, "grape")}
              {totals.npsCount === 0 ? (
                <p className="text-sm text-muted-foreground">{t("charts.noNps")}</p>
              ) : (
                <NpsBar label={t("charts.npsBreakdown")} segments={npsSegments} />
              )}
            </Card>
            <Card className="gap-4 px-6">
              {cardTitle(t("charts.csatDistribution"), Star, "ember")}
              {totals.csatCount === 0 ? <p className="text-sm text-muted-foreground">{t("charts.noCsat")}</p> : <BarList rows={ratingRows} />}
            </Card>
          </section>
        </>
      )}

      <AiInsightsSection locale={locale} organizationId={organizationId} filters={filters} range={range} canAnalyze={can(membership.role, "surveys.manage")} />

      {sectionLabel(t("sections.locations"))}
      <Card className="gap-0 overflow-hidden p-0">
        <div className="px-6 pt-5 pb-3">{cardTitle(t("locations.title"), MapPin, "ultra")}</div>
        {analytics.locations.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">{t("locations.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-ink-100 bg-white/60 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-2.5 text-start font-medium">{t("locations.location")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end font-medium">{t("locations.responses")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start font-medium">{t("locations.csat")}</th>
                  <th scope="col" className="px-6 py-2.5 text-end font-medium">{t("locations.nps")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
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
        {cardTitle(t("questions.title"), ListChecks, "grape")}
        {definition && questionStats && filters.survey ? (
          <QuestionResults definition={definition} stats={questionStats} surveyId={filters.survey} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("questions.chooseSurvey")}</p>
        )}
      </Card>
    </div>
  );
}
