import { ArrowRight, MessageSquareQuote } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatCount, formatNumber, formatPercent } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { textIn } from "@/modules/surveys/definition";
import type { ChoiceReport, QuestionReport, ScaleReport, StudyReport, TextReport } from "../report";
import { effectLabel, type TestResult } from "../stats";

/** Keeps "45%" and "+1.2" reading left to right inside Arabic sentences. */
const isolate = (text: string) => `⁦${text}⁩`;

type Format = ReturnType<typeof formatters>;

function formatters(locale: Locale) {
  return {
    decimal: (value: number) => formatNumber(locale, value, { maximumFractionDigits: 2 }),
    signed: (value: number) => formatNumber(locale, value, { maximumFractionDigits: 2, signDisplay: "exceptZero" }),
    percent: (ratio: number) => formatPercent(locale, ratio, 0),
    count: (value: number) => formatCount(locale, value),
    fixed: (value: number, digits: number) => formatNumber(locale, value, { minimumFractionDigits: digits, maximumFractionDigits: digits }),
  };
}

/** The before-and-after report: headline numbers, then every question compared. */
export async function StudyReportView({ locale, report, fallback }: { locale: Locale; report: StudyReport; fallback: Locale }) {
  const t = await getTranslations({ locale, namespace: "studies.report" });
  const f = formatters(locale);
  const tiles = [
    { label: t("responsesBefore"), value: f.count(report.responses.pre) },
    { label: t("responsesAfter"), value: f.count(report.responses.post) },
    ...(report.matched === null
      ? []
      : [
          { label: t("matched"), value: f.count(report.matched), accent: true },
          { label: t("followUp"), value: report.responses.pre ? f.percent(report.matched / report.responses.pre) : "–", hint: t("followUpHint") },
        ]),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div role="list" className={cn("grid grid-cols-2 gap-3", tiles.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-2")}>
        {tiles.map((tile) => (
          <div
            key={tile.label}
            role="listitem"
            className={cn("flex flex-col gap-1.5 rounded-card border p-5", tile.accent ? "border-ink bg-ink text-sand" : "border-border bg-white")}
          >
            <span className={cn("text-sm font-medium", tile.accent ? "text-ink-200" : "text-muted-foreground")}>{tile.label}</span>
            <span className="font-display text-4xl leading-none font-extrabold tracking-[-0.03em] tabular">{tile.value}</span>
            {tile.hint && <span className="text-xs text-muted-foreground">{tile.hint}</span>}
          </div>
        ))}
      </div>

      {report.responses.pre + report.responses.post === 0 ? (
        <p className="rounded-card border border-dashed border-ink-200 bg-white/60 p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        report.questions.map((q, index) => (
          <QuestionCard key={q.id} q={q} index={index} locale={locale} fallback={fallback} t={t} f={f} />
        ))
      )}
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations<"studies.report">>>;

function QuestionCard({ q, index, locale, fallback, t, f }: { q: QuestionReport; index: number; locale: Locale; fallback: Locale; t: T; f: Format }) {
  const title = textIn(q.question.title, locale, fallback);
  return (
    <section aria-labelledby={`q-${q.id}`} className="flex flex-col gap-5 rounded-card border border-border bg-white p-5 sm:p-6">
      <header className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
        <span aria-hidden className="slice-sm flex h-7 w-9 shrink-0 items-center justify-center bg-sand-100 font-display text-sm font-extrabold">
          {f.count(index + 1)}
        </span>
        <h3 id={`q-${q.id}`} className="min-w-0 flex-1 text-lg leading-snug">
          {title}
        </h3>
        {!(q.inPre && q.inPost) && (
          <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-semibold text-ink-600">{t(`onlyIn.${q.inPre ? "pre" : "post"}`)}</span>
        )}
      </header>
      {q.kind === "scale" && <ScaleBody q={q} t={t} f={f} />}
      {q.kind === "choice" && <ChoiceBody q={q} locale={locale} fallback={fallback} t={t} f={f} />}
      {q.kind === "text" && <TextBody q={q} t={t} f={f} />}
    </section>
  );
}

function ScaleBody({ q, t, f }: { q: ScaleReport; t: T; f: Format }) {
  if (q.pre.n + q.post.n === 0) return <p className="text-sm text-muted-foreground">{t("noAnswers")}</p>;
  const change = q.pre.mean !== null && q.post.mean !== null ? q.post.mean - q.pre.mean : null;
  const total = { pre: Math.max(1, q.pre.n), post: Math.max(1, q.post.n) };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-4">
            <Average label={t("before")} value={q.pre.mean} n={q.pre.n} muted t={t} f={f} />
            <ArrowRight aria-hidden strokeWidth={1.75} className="mb-3 size-5 shrink-0 text-ink-300 rtl:-scale-x-100" />
            <Average label={t("after")} value={q.post.mean} n={q.post.n} t={t} f={f} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("outOf", { max: f.count(q.max) })}</span>
            {change !== null && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold tabular",
                  change > 0 ? "bg-mint-50 text-mint-700" : change < 0 ? "bg-ember-50 text-ember-700" : "bg-sand-100 text-ink-600",
                )}
              >
                {change === 0 ? t("noChange") : `${t("change")} ${isolate(f.signed(change))}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2" aria-label={t("distribution")} role="group">
          <span className="text-xs font-medium text-muted-foreground">{t("distribution")}</span>
          {q.distribution.pre.map((preCount, i) => {
            const postCount = q.distribution.post[i];
            const value = q.min + i;
            return (
              <div key={value} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2">
                <span className="text-end font-display text-sm font-bold tabular">{f.count(value)}</span>
                <div className="flex flex-col gap-1">
                  <Bar ratio={preCount / total.pre} className="bg-ink-200" label={t("beforeShare", { percent: isolate(f.percent(preCount / total.pre)) })} />
                  <Bar ratio={postCount / total.post} className="bg-ultramarine" label={t("afterShare", { percent: isolate(f.percent(postCount / total.post)) })} />
                </div>
              </div>
            );
          })}
          <Legend t={t} />
        </div>
      </div>
      <TestLine test={q.test} t={t} f={f} />
      {q.movement && (
        <p className="text-sm text-muted-foreground">
          {t("movement", { improved: f.count(q.movement.improved), same: f.count(q.movement.same), declined: f.count(q.movement.declined) })}
        </p>
      )}
    </div>
  );
}

function Average({ label, value, n, muted, t, f }: { label: string; value: number | null; n: number; muted?: boolean; t: T; f: Format }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className={cn("font-display text-5xl leading-none font-extrabold tracking-[-0.04em] tabular", muted ? "text-ink-400" : "text-ultramarine")}>
        {value === null ? "–" : f.decimal(value)}
      </span>
      <span className="text-xs text-muted-foreground">{t("n", { count: f.count(n) })}</span>
    </div>
  );
}

function Bar({ ratio, className, label }: { ratio: number; className: string; label: string }) {
  return (
    <div className="flex items-center gap-2" title={label}>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand-100">
        <div className={cn("h-full rounded-full transition-[width] duration-[320ms] ease-[var(--ease-standard)]", className)} style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
      <span className="w-24 shrink-0 text-xs text-muted-foreground tabular">{label}</span>
    </div>
  );
}

function Legend({ t }: { t: T }) {
  return (
    <div aria-hidden className="flex gap-4 ps-9 pt-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-ink-200" />
        {t("before")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-ultramarine" />
        {t("after")}
      </span>
    </div>
  );
}

function TestLine({ test, t, f }: { test: TestResult | null; t: T; f: Format }) {
  if (!test || test.p === null || test.t === null || test.df === null) {
    return <p className="rounded-tile bg-sand-50 px-4 py-3 text-sm text-muted-foreground">{t("notEnough")}</p>;
  }
  const significant = test.p < 0.05;
  const p = test.p < 0.001 ? `< ${f.decimal(0.001)}` : `= ${formatFixed(test.p, 3, f)}`;
  const df = Number.isInteger(test.df) ? f.count(test.df) : formatFixed(test.df, 1, f);
  const label = effectLabel(test.effectSize);
  return (
    <div className="flex flex-col gap-2 rounded-tile bg-sand-50 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", significant ? "bg-ultra-50 text-ultramarine" : "bg-sand-100 text-ink-600")}>
          {significant ? t("significant") : t("notSignificant")}
        </span>
      </div>
      <p className="text-muted-foreground">
        {test.kind === "paired" ? t("paired", { count: f.count(test.n) }) : t("welch")}
        {" · "}
        <bdi dir="ltr">{t("testLine", { df, t: formatFixed(test.t, 2, f), p })}</bdi>
        {test.effectSize !== null && label && (
          <>
            {" · "}
            {t("effect", { value: isolate(formatFixed(test.effectSize, 2, f)), label: t(`effects.${label}`) })}
          </>
        )}
      </p>
    </div>
  );
}

const formatFixed = (value: number, digits: number, f: Format) => f.fixed(value, digits);

function ChoiceBody({ q, locale, fallback, t, f }: { q: ChoiceReport; locale: Locale; fallback: Locale; t: T; f: Format }) {
  if (q.answered.pre + q.answered.post === 0) return <p className="text-sm text-muted-foreground">{t("noAnswers")}</p>;
  const options = q.question.type === "single_choice" || q.question.type === "multiple_choice" ? q.question.options : [];
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("answered", { pre: f.count(q.answered.pre), post: f.count(q.answered.post) })}</p>
      <ul className="flex flex-col divide-y divide-ink-100">
        {q.options.map((row) => {
          const option = options.find((o) => o.id === row.id);
          const change = Math.round((row.post - row.pre) * 100);
          return (
            <li key={row.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_4.5rem] sm:items-center sm:gap-4">
              <span className="font-medium">{option ? textIn(option.label, locale, fallback) : row.id}</span>
              <div className="flex flex-col gap-1">
                <Bar ratio={row.pre} className="bg-ink-200" label={t("beforeShare", { percent: isolate(f.percent(row.pre)) })} />
                <Bar ratio={row.post} className="bg-ultramarine" label={t("afterShare", { percent: isolate(f.percent(row.post)) })} />
              </div>
              <span className={cn("text-sm font-bold tabular sm:text-end", change > 0 ? "text-mint-700" : change < 0 ? "text-ember-700" : "text-muted-foreground")}>
                {change === 0 ? t("noChange") : t("points", { value: isolate(f.signed(change)) })}
              </span>
            </li>
          );
        })}
      </ul>
      <Legend t={t} />
    </div>
  );
}

function TextBody({ q, t, f }: { q: TextReport; t: T; f: Format }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("answered", { pre: f.count(q.answered.pre), post: f.count(q.answered.post) })}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {(["pre", "post"] as const).map((phase) => (
          <div key={phase} className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("latest")} · {phase === "pre" ? t("before") : t("after")}
            </span>
            {q.latest[phase].length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noComments")}</p>
            ) : (
              q.latest[phase].map((comment, i) => (
                <blockquote key={i} className="flex gap-2 rounded-tile bg-sand-50 px-3.5 py-3 text-sm">
                  <MessageSquareQuote aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-ink-300" />
                  <p dir="auto">{comment}</p>
                </blockquote>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
