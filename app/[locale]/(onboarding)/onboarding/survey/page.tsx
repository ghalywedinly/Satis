import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { OnboardingProgress, ONBOARDING_STEPS } from "@/modules/organizations/components/onboarding-progress";
import { FirstSurveyButton } from "@/modules/surveys/components/first-survey-button";

export async function generateMetadata({ params }: PageProps<"/[locale]/onboarding/survey">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return { title: t("survey.title") };
}

/** Onboarding step 5: create the first survey from the template. */
export default async function OnboardingSurveyPage({ params }: PageProps<"/[locale]/onboarding/survey">) {
  const locale = await resolveLocale(params);
  await requireMembership(locale);
  const [t, tt, te] = await Promise.all([
    getTranslations({ locale, namespace: "onboarding" }),
    getTranslations({ locale, namespace: "surveyTemplate" }),
    getTranslations({ locale, namespace: "errors" }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <OnboardingProgress current={5} label={t("progress", { current: formatCount(locale, 5), total: formatCount(locale, ONBOARDING_STEPS) })} />
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] leading-tight font-extrabold sm:text-4xl">{t("survey.title")}</h1>
        <p className="text-muted-foreground">{t("survey.body")}</p>
      </div>
      <ol className="flex flex-col gap-3 rounded-card border border-border bg-white p-5">
        {(["rating", "liked", "nps", "comment"] as const).map((key) => (
          <li key={key} className="flex items-start gap-3">
            <CheckCircle2 aria-hidden strokeWidth={1.75} className="mt-0.5 size-5 shrink-0 text-ultramarine" />
            <span>{tt(key)}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3">
        <FirstSurveyButton label={t("survey.create")} errorMessages={{ generic: te("generic"), forbidden: te("forbidden") }} />
        <Button asChild variant="ghost" className="self-center">
          <Link href="/dashboard">{t("survey.skip")}</Link>
        </Button>
      </div>
    </div>
  );
}
