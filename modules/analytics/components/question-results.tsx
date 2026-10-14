import { useLocale, useTranslations } from "next-intl";
import { formatCount, formatNumber, formatPercent } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { textIn, type SurveyDefinition } from "@/modules/surveys/definition";
import { npsScore } from "../metrics";
import type { QuestionStats } from "../queries";
import { BarList } from "./breakdowns";

/** Results for each question of one survey, in the survey's order. */
export function QuestionResults({ definition, stats, surveyId }: { definition: SurveyDefinition; stats: QuestionStats; surveyId: string }) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as Locale;
  const title = (text: SurveyDefinition["questions"][number]["title"]) => textIn(text, locale, definition.defaultLocale);
  const share = (count: number, total: number) => `${formatCount(locale, count)} · ${formatPercent(locale, total ? count / total : 0, 0)}`;

  return (
    <ol className="flex flex-col divide-y divide-border">
      {definition.questions.map((question) => {
        const s = stats[question.id];
        const answers = s?.answers ?? 0;
        let body: React.ReactNode = null;
        if (answers === 0) {
          body = <p className="text-sm text-muted-foreground">{t("questions.noAnswers")}</p>;
        } else if (question.type === "rating") {
          const max = Math.max(...[1, 2, 3, 4, 5].map((n) => s.numbers[n] ?? 0), 1);
          body = (
            <>
              <p className="font-semibold">{t("questions.average", { score: formatNumber(locale, s.average ?? 0, { maximumFractionDigits: 1 }) })}</p>
              <BarList
                rows={[5, 4, 3, 2, 1].map((n) => ({
                  key: String(n),
                  label: t("charts.ratingLabel", { score: formatCount(locale, n) }),
                  share: (s.numbers[n] ?? 0) / max,
                  value: share(s.numbers[n] ?? 0, answers),
                }))}
              />
            </>
          );
        } else if (question.type === "nps") {
          const count = (from: number, to: number) => Object.entries(s.numbers).reduce((sum, [n, c]) => (Number(n) >= from && Number(n) <= to ? sum + c : sum), 0);
          const score = npsScore({ npsCount: answers, promoters: count(9, 10), detractors: count(0, 6) });
          body = (
            <>
              <p className="font-semibold">{t("questions.nps", { score: formatNumber(locale, score ?? 0, { signDisplay: "exceptZero" }) })}</p>
              <BarList
                rows={(
                  [
                    ["promoters", count(9, 10)],
                    ["passives", count(7, 8)],
                    ["detractors", count(0, 6)],
                  ] as const
                ).map(([key, c]) => ({ key, label: t(`charts.${key}`), share: c / answers, value: share(c, answers) }))}
              />
            </>
          );
        } else if (question.type === "single_choice" || question.type === "multiple_choice") {
          const counts = question.options.map((o) => ({ option: o, count: s.options[o.id] ?? 0 })).sort((a, b) => b.count - a.count);
          const max = Math.max(...counts.map((c) => c.count), 1);
          body = (
            <BarList
              rows={counts.map(({ option, count }) => ({ key: option.id, label: title(option.label), share: count / max, value: share(count, answers) }))}
            />
          );
        } else {
          body = (
            <Link href={`/inbox?survey=${surveyId}&comments=1`} className="w-fit text-sm font-semibold text-ultramarine underline-offset-4 hover:underline">
              {t("questions.readComments")}
            </Link>
          );
        }
        return (
          <li key={question.id} className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-sans text-sm font-semibold">{title(question.title)}</h3>
              <span className="text-xs text-muted-foreground">{t("questions.answers", { count: formatCount(locale, answers) })}</span>
            </div>
            {body}
          </li>
        );
      })}
    </ol>
  );
}
