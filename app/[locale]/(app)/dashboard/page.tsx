import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ListChecks, Megaphone, MessageSquareText, QrCode } from "lucide-react";
import { ShareSurveyIllustration } from "@/components/brand/illustrations";
import { SatisMark } from "@/components/brand/satis-mark";
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
import { NpsBar } from "@/modules/analytics/components/breakdowns";
import { BusyHours, type BusyRow } from "@/modules/analytics/components/busy-hours";
import { DashboardFilterBar } from "@/modules/analytics/components/dashboard-filters";
import { QuestionResults } from "@/modules/analytics/components/question-results";
import { ScoreHero } from "@/modules/analytics/components/score-hero";
import { TrendPanel, type TrendSeries } from "@/modules/analytics/components/trend-panel";
import { averageRating, csatRatio, delta, npsScore, relativeChange } from "@/modules/analytics/metrics";
import { dashboardQuery, parseDashboardFilters, rangeFor, riyadhDate } from "@/modules/analytics/period";
import { getAnalytics, getPublishedDefinition, getQuestionStats, getTrends, type DayCounts } from "@/modules/analytics/queries";
import { countUnread, getFilterOptions } from "@/modules/feedback/queries";
import { CreateSurveyButton } from "@/modules/surveys/components/create-survey-button";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("metaTitle") };
}

/** Rounds a range out to clean gridlines (three or four ticks) that include every value. */
function niceScale(locale: Locale, values: number[], floor: number | null, ceiling: number | null, format: (v: number) => string) {
  const lo0 = values.length ? Math.min(...values) : 0;
  const hi0 = values.length ? Math.max(...values) : 1;
  const span = Math.max(hi0 - lo0, 1);
  const raw = span / 3;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  let min = Math.floor(lo0 / step) * step;
  let max = Math.ceil(hi0 / step) * step;
  if (max === min) max = min + step;
  if (floor !== null) min = Math.max(floor, min);
  if (ceiling !== null) max = Math.min(ceiling, max);
  const ticks: { value: number; label: string }[] = [];
  for (let v = min; v <= max + step / 1000; v += step) ticks.push({ value: Math.round(v * 1000) / 1000, label: format(Math.round(v * 1000) / 1000) });
  void locale;
  return { min, max, ticks };
}

const sum = (days: DayCounts[], key: keyof Omit<DayCounts, "day">) => days.reduce((acc, d) => acc + d[key], 0);

export default async function DashboardPage({ params, searchParams }: PageProps<"/[locale]/dashboard">) {
  const locale = await resolveLocale(params);
  const { user, membership } = await requireMembership(locale);
  const organizationId = membership.organization.id;
  const filters = parseDashboardFilters(await searchParams);
  const range = rangeFor(filters);
  const supabase = await createSupabaseServerClient();

  const [profile, t, surveyCount, options, analytics, trends, definition, questionStats, unread, openNegative] = await Promise.all([
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
    getTrends(organizationId, filters, range),
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
  const canManage = can(membership.role, "surveys.manage");

  const head = (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-60 flex-1 flex-col gap-0.5">
        <p className="text-sm text-ink-500">{formatDate(locale, new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="font-sans text-3xl font-bold">{name ? t("head.hello", { name }) : t("head.helloNoName")}</h1>
      </div>
      <Button asChild variant="outline">
        <Link href="/inbox">
          <MessageSquareText aria-hidden strokeWidth={1.75} />
          {t("hero.openInbox")}
          {unread > 0 && <span className="rounded-full bg-ember px-1.5 py-0.5 text-xs leading-none font-bold text-ink tabular">{formatCount(locale, Math.min(unread, 99))}</span>}
        </Link>
      </Button>
      <Button asChild>
        <Link href="/surveys">
          <QrCode aria-hidden strokeWidth={1.75} />
          {t("head.shareQr")}
        </Link>
      </Button>
    </div>
  );

  if (surveyCount === 0) {
    return (
      <div className="flex flex-col gap-6">
        {head}
        <Card>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-start gap-4">
              <h2 className="text-2xl font-bold">{t("createSurvey")}</h2>
              <p className="max-w-md text-muted-foreground">{t("createSurveyBody")}</p>
              {canManage && <CreateSurveyButton label={t("createSurvey")} />}
            </div>
            <ShareSurveyIllustration className="h-44 w-auto shrink-0" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const filterBar = <DashboardFilterBar key={dashboardQuery(filters)} filters={filters} today={riyadhDate(new Date())} locations={options.locations} surveys={options.surveys} />;
  const { totals, previous } = analytics;

  if (totals.responses === 0) {
    return (
      <div className="flex flex-col gap-6">
        {head}
        {filterBar}
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
        <AiInsightsSection locale={locale} organizationId={organizationId} filters={filters} range={range} canAnalyze={canManage} />
      </div>
    );
  }

  // Inside Arabic sentences, numbers like "92%" stay left-to-right.
  const isolate = (text: string) => `⁦${text}⁩`;
  const one = (v: number) => formatNumber(locale, v, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const pct = (ratio: number) => formatPercent(locale, ratio, 0);
  const csat = csatRatio(totals);
  const nps = npsScore(totals);
  const average = averageRating(totals.csatSum, totals.csatCount);
  const prevCsatSum = sum(trends.previous, "csatSum");
  const prevCsatCount = sum(trends.previous, "csatCount");
  const prevAverage = averageRating(prevCsatSum, prevCsatCount);
  const prevComments = sum(trends.previous, "comments");

  type Delta = { text: string; good: boolean | null } | null;
  const change = (value: number | null, format: (v: number) => string, upIsGood = true): Delta => {
    if (value === null) return null;
    const rounded = Math.round(value * 1000) / 1000;
    if (rounded === 0) return { text: t("kpi.same"), good: null };
    return { text: `${rounded > 0 ? "▲" : "▼"} ${format(Math.abs(rounded))}`, good: rounded > 0 === upIsGood };
  };

  // ───── Score hero ─────
  const distribution = [...analytics.csatDistribution].reverse().map((d) => ({
    stars: t("score.starsLabel", { score: formatCount(locale, d.score) }),
    share: totals.csatCount ? d.count / totals.csatCount : 0,
    value: pct(totals.csatCount ? d.count / totals.csatCount : 0),
    tone: d.score >= 4 ? ("zest" as const) : d.score === 3 ? ("grey" as const) : ("ember" as const),
  }));
  const dailyAverage = trends.current.map((d) => averageRating(d.csatSum, d.csatCount));

  // ───── Busy hours (Saudi week starts on Saturday) ─────
  const dowDate = (dow: number, hour = 12) => `2026-03-0${1 + dow}T${String(hour).padStart(2, "0")}:00:00+03:00`; // 1 March 2026 is a Sunday.
  const dayName = (dow: number, weekday: "short" | "long") => formatDate(locale, dowDate(dow), { weekday });
  const timeName = (hour: number) => formatDate(locale, dowDate(0, hour), { hour: "numeric" });
  const busy = trends.busyHours;
  const activeHours = busy.map((b) => b.hour);
  let firstHour = activeHours.length ? Math.min(...activeHours) : 8;
  let lastHour = activeHours.length ? Math.max(...activeHours) : 23;
  while (lastHour - firstHour < 9) {
    if (firstHour > 0) firstHour -= 1;
    if (lastHour - firstHour < 9 && lastHour < 23) lastHour += 1;
    if (firstHour === 0 && lastHour === 23) break;
  }
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, i) => firstHour + i);
  const level = (share: number) => (share === 0 ? 0 : share < 0.1 ? 1 : share < 0.2 ? 2 : share < 0.35 ? 3 : 4);
  const busyRows: BusyRow[] = [6, 0, 1, 2, 3, 4, 5].map((dow) => ({
    day: dayName(dow, "short"),
    cells: hours.map((hour) => {
      const cell = busy.find((b) => b.dow === dow && b.hour === hour);
      const where = { day: dayName(dow, "long"), time: timeName(hour) };
      if (!cell) return { level: null, label: t("busy.cellNone", where) };
      return { level: level(cell.negative / cell.responses), label: t("busy.cell", { ...where, negative: formatCount(locale, cell.negative), responses: formatCount(locale, cell.responses) }) };
    }),
  }));
  const peak = [...busy].sort((a, b) => b.negative - a.negative || b.responses - a.responses)[0];
  const hasPeak = peak && peak.negative > 0;

  // ───── Branches ─────
  const scores = new Map(trends.locationScores.map((s) => [s.id, s.csatSum]));
  const branches = analytics.locations
    .filter((l) => l.csatCount > 0)
    .map((l) => ({ ...l, average: (scores.get(l.id) ?? 0) / l.csatCount, ratio: csatRatio(l) ?? 0 }))
    .sort((a, b) => b.average - a.average || b.csatCount - a.csatCount);
  const top = branches[0];
  const lowest = branches.length > 1 ? branches[branches.length - 1] : undefined;
  const status = (avg: number) => (avg >= 4.5 ? "good" : avg >= 4 ? "ok" : "low");

  // ───── Notes ─────
  type Note = { tone: "ember" | "zest" | "mint"; text: string; cta?: string; href?: string };
  const notes: Note[] = [];
  if (openNegative > 0) notes.push({ tone: "ember", text: t("notes.open", { count: formatCount(locale, openNegative) }), cta: t("notes.openCta"), href: "/inbox?sentiment=negative" });
  if (hasPeak) notes.push({ tone: "ember", text: t("notes.peak", { day: dayName(peak.dow, "long"), time: timeName(peak.hour), count: formatCount(locale, peak.negative) }), cta: t("notes.peakCta"), href: "/inbox?sentiment=negative" });
  if (lowest && top && lowest.ratio < top.ratio)
    notes.push({ tone: "zest", text: t("notes.lowest", { name: lowest.name, percent: isolate(pct(lowest.ratio)) }), cta: t("notes.lowestCta", { name: lowest.name }), href: `/dashboard${dashboardQuery({ ...filters, location: lowest.id })}` });
  if (top && notes.length < 3) notes.push({ tone: "mint", text: t("notes.top", { name: top.name, percent: isolate(pct(top.ratio)) }), cta: t("notes.topCta"), href: `/inbox?location=${top.id}` });
  if (notes.length === 0) notes.push({ tone: "mint", text: t("notes.allGood") });
  const dot = { ember: "bg-ember", zest: "bg-zest", mint: "bg-mint" } as const;

  // ───── Metric cards and chart ─────
  const dayLabel = (day: string) => formatDate(locale, `${day}T12:00:00+03:00`, { day: "numeric", month: "short" });
  const noValue = t("trend.noValue");
  const seriesFor = (
    key: "csat" | "responses" | "nps" | "comments",
    value: string,
    deltaValue: Delta,
    note: string,
    pick: (d: DayCounts) => number | null,
    format: (v: number) => string,
    bounds: [number | null, number | null],
  ): TrendSeries => {
    const points = trends.current.map((d, i) => {
      const prev = trends.previous[i];
      const current = pick(d);
      const before = prev ? pick(prev) : null;
      return { dayLabel: dayLabel(d.day), current, previous: before, currentLabel: current === null ? noValue : format(current), previousLabel: before === null ? noValue : format(before) };
    });
    const values = points.flatMap((p) => [p.current, p.previous]).filter((v): v is number => v !== null);
    const scale = niceScale(locale, values, bounds[0], bounds[1], format);
    return { key, label: t(`trend.labels.${key}`), value, delta: deltaValue, note, title: t(`trend.titles.${key}`), subtitle: t(`trend.subtitles.${key}`), points, ...scale };
  };
  const count = (v: number) => formatCount(locale, v);
  const series: TrendSeries[] = [
    seriesFor(
      "csat",
      csat === null ? t("kpi.noData") : pct(csat),
      change(delta(csat, csatRatio(previous)), (v) => t("kpi.points", { value: formatCount(locale, v * 100) })),
      t("trend.notes.csat"),
      (d) => {
        const r = csatRatio(d);
        return r === null ? null : Math.round(r * 1000) / 10;
      },
      (v) => formatPercent(locale, v / 100, 0),
      [0, 100],
    ),
    seriesFor("responses", count(totals.responses), change(relativeChange(totals.responses, previous.responses), (v) => pct(v)), t("trend.notes.responses"), (d) => d.responses, count, [0, null]),
    seriesFor(
      "nps",
      nps === null ? t("kpi.noData") : formatNumber(locale, nps, { signDisplay: "exceptZero" }),
      change(delta(nps, npsScore(previous)), (v) => t("kpi.points", { value: formatCount(locale, v) })),
      t("trend.notes.nps", { count: count(totals.npsCount) }),
      (d) => npsScore(d),
      (v) => formatNumber(locale, v, { signDisplay: "exceptZero", maximumFractionDigits: 0 }),
      [-100, 100],
    ),
    seriesFor(
      "comments",
      count(totals.comments),
      change(relativeChange(totals.comments, prevComments), (v) => pct(v)),
      t("trend.notes.comments", { percent: pct(totals.comments / totals.responses) }),
      (d) => d.comments,
      count,
      [0, null],
    ),
  ];

  const passives = totals.npsCount - totals.promoters - totals.detractors;
  const npsSegments = (
    [
      ["detractors", totals.detractors],
      ["passives", passives],
      ["promoters", totals.promoters],
    ] as const
  ).map(([key, n]) => {
    const share = totals.npsCount > 0 ? n / totals.npsCount : 0;
    return { key, label: t(`charts.${key}`), share, value: pct(share) };
  });

  const sectionTitle = (title: string, subtitle?: string) => (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <h2 className="flex-1 font-sans text-base font-bold">{title}</h2>
      {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {head}
      {filterBar}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ScoreHero
          score={average}
          distribution={distribution}
          spark={dailyAverage}
          trend={change(delta(average, prevAverage), one)}
          labels={{
            eyebrow: t("score.eyebrow"),
            value: average === null ? "–" : one(average),
            outOf: t("score.outOf"),
            stars: t("score.stars", { score: average === null ? "–" : one(average) }),
            basis: totals.csatCount ? t("score.basis", { count: count(totals.csatCount) }) : t("score.noRatings"),
            distribution: t("score.distribution"),
            trendCaption: t("score.trendCaption"),
            linkLabel: t("score.linkLabel"),
            linkHref: "/surveys",
          }}
        />
        <section className="flex flex-col gap-1 rounded-card border border-ink-100 bg-white p-5">
          <div className="flex items-center gap-2.5 pb-2">
            <span aria-hidden className="flex size-8 items-center justify-center rounded-control bg-zest">
              <SatisMark tone="ink" className="h-3.5" />
            </span>
            <span className="flex flex-col">
              <h2 className="font-sans text-base font-bold">{t("notes.title")}</h2>
              <span className="text-xs text-ink-500">{t("notes.subtitle", { count: count(totals.responses) })}</span>
            </span>
          </div>
          <ul className="flex flex-col">
            {notes.slice(0, 3).map((note) => (
              <li key={note.text} className="flex gap-3 border-t border-ink-100 py-3">
                <span aria-hidden className={cn("mt-1.5 size-2.5 shrink-0 rounded-[3px]", dot[note.tone])} />
                <span className="flex flex-col items-start gap-1.5 text-sm leading-relaxed">
                  {note.text}
                  {note.cta && note.href && (
                    <Link href={note.href} className="rounded-sm font-semibold text-ultramarine outline-none hover:underline focus-visible:shadow-focus">
                      {note.cta}
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <TrendPanel series={series} labels={{ current: t("trend.current"), previous: t("trend.previous"), tablist: t("trend.tablist"), day: t("trend.day") }} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4 rounded-card border border-ink-100 bg-white p-5 sm:p-6">
          {sectionTitle(t("busy.title"), t("busy.subtitle"))}
          {busy.length === 0 ? (
            <p className="text-sm text-ink-500">{t("busy.empty")}</p>
          ) : (
            <BusyHours
              rows={busyRows}
              hours={hours.map((h) => formatNumber(locale, h % 12 === 0 ? 12 : h % 12))}
              summary={hasPeak ? t("busy.summary", { day: dayName(peak.dow, "long"), time: timeName(peak.hour) }) : t("busy.summaryNone")}
              legend={{ less: t("busy.less"), more: t("busy.more"), none: t("busy.none") }}
            />
          )}
        </section>

        {top ? (
          <section className="relative isolate flex min-h-80 flex-col items-start gap-3 overflow-hidden rounded-card bg-zest p-6 text-ink">
            <span className="text-sm font-bold">{t("top.eyebrow")}</span>
            <span className="max-w-[62%] font-sans text-3xl leading-snug font-bold">{top.name}</span>
            <span className="flex items-center gap-2">
              <span className="font-display text-4xl font-extrabold tracking-tight tabular">{one(top.average)}</span>
              <span className="font-display text-lg font-bold">{t("score.outOf")}</span>
            </span>
            <span className="max-w-[60%] text-sm">{t("top.detail", { percent: isolate(pct(top.ratio)), count: count(top.csatCount) })}</span>
            <Button asChild className="relative z-10 mt-auto bg-ink text-white hover:bg-ink-700">
              <Link href={`/inbox?location=${top.id}`}>{t("top.cta")}</Link>
            </Button>
            <Image
              src="/characters/associate.png"
              alt=""
              width={1177}
              height={1337}
              sizes="200px"
              className="pointer-events-none absolute -end-6 -bottom-8 h-56 w-auto drop-shadow-[10px_10px_0_#0B0D12]"
            />
          </section>
        ) : (
          <section className="flex flex-col gap-3 rounded-card border border-ink-100 bg-white p-6">
            {sectionTitle(t("top.eyebrow"))}
            <p className="text-sm text-ink-500">{t("branches.noRatings")}</p>
          </section>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-2 rounded-card border border-ink-100 bg-white p-5 sm:p-6">
          {sectionTitle(t("branches.title"), t("branches.subtitle"))}
          {branches.length === 0 ? (
            <p className="text-sm text-ink-500">{analytics.locations.length === 0 ? t("locations.empty") : t("branches.noRatings")}</p>
          ) : (
            <ul className="flex flex-col">
              {branches.map((b) => {
                const s = status(b.average);
                return (
                  <li key={b.id}>
                    <Link
                      href={`/dashboard${dashboardQuery({ ...filters, location: b.id })}`}
                      className="grid grid-cols-[minmax(0,1fr)_7rem_2.5rem] items-center gap-3 rounded-control border-t border-ink-100 px-2 py-3 outline-none hover:bg-ink-50 focus-visible:shadow-focus sm:grid-cols-[minmax(0,1fr)_10rem_2.5rem]"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold">{b.name}</span>
                        <span className="text-xs text-ink-500">
                          <span className={cn("font-semibold", s === "good" ? "text-mint-700" : s === "ok" ? "text-ink-700" : "text-ember-700")}>{t(`branches.status.${s}`)}</span>
                          {" · "}
                          {t("branches.meta", { percent: isolate(pct(b.ratio)), count: count(b.csatCount) })}
                        </span>
                      </span>
                      <span aria-hidden className="h-2 overflow-hidden rounded-full bg-ink-50">
                        <span className={cn("block h-full rounded-full", s === "good" ? "bg-mint" : s === "ok" ? "bg-zest" : "bg-ember")} style={{ width: `${Math.round((b.average / 5) * 100)}%` }} />
                      </span>
                      <span className="text-end font-display text-base font-extrabold tabular">{one(b.average)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-card border border-ink-100 bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-sans text-base font-bold">
            <Megaphone aria-hidden strokeWidth={1.75} className="size-4 text-ink-500" />
            {t("charts.npsBreakdown")}
          </h2>
          {totals.npsCount === 0 ? <p className="text-sm text-ink-500">{t("charts.noNps")}</p> : <NpsBar label={t("charts.npsBreakdown")} segments={npsSegments} />}
        </section>
      </div>

      <AiInsightsSection locale={locale} organizationId={organizationId} filters={filters} range={range} canAnalyze={canManage} />

      <Card className="gap-4 px-6">
        <h2 className="flex items-center gap-2 font-sans text-base font-bold">
          <ListChecks aria-hidden strokeWidth={1.75} className="size-4 text-ink-500" />
          {t("questions.title")}
        </h2>
        {definition && questionStats && filters.survey ? (
          <QuestionResults definition={definition} stats={questionStats} surveyId={filters.survey} />
        ) : (
          <p className="text-sm text-muted-foreground">{t("questions.chooseSurvey")}</p>
        )}
      </Card>
    </div>
  );
}
