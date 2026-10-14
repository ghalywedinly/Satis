import type { Metadata } from "next";
import { SatisMark } from "@/components/brand/satis-mark";
import { captureServerEvent } from "@/lib/observability/analytics";
import { loadMessages } from "@/locales";
import { SurveyForm } from "@/modules/surveys/components/survey-form";
import { getPublicSurvey, resolveSurveyLocale } from "@/modules/surveys/public-data";

export async function generateMetadata({ params }: PageProps<"/s/[code]/[[...lang]]">): Promise<Metadata> {
  const { code } = await params;
  const survey = await getPublicSurvey(code);
  // Survey links are meant for customers on site, not for search engines.
  return { title: survey?.organizationName ?? "Satis", robots: { index: false, follow: false } };
}

export default async function PublicSurveyPage({ params }: PageProps<"/s/[code]/[[...lang]]">) {
  const { code, lang } = await params;
  const survey = await getPublicSurvey(code);
  const locale = resolveSurveyLocale(survey, lang);
  const labels = (await loadMessages(locale ?? "ar")).publicSurvey;

  if (!survey || !locale) {
    // Without a live survey we don't know its language: say it in both unless one was requested.
    const languages: ("ar" | "en")[] = lang?.[0] === "en" ? ["en"] : lang?.[0] === "ar" ? ["ar"] : ["ar", "en"];
    const messages = await Promise.all(languages.map(async (l) => ({ locale: l, text: (await loadMessages(l)).publicSurvey })));
    return (
      <main className="mx-auto flex min-h-dvh max-w-[460px] flex-col items-center justify-center gap-8 px-6 text-center">
        <SatisMark tone="ink-ultra" className="h-12" />
        {messages.map(({ locale: l, text }, i) => (
          <section key={l} lang={l} dir={l === "ar" ? "rtl" : "ltr"} className="flex flex-col gap-2">
            {i === 0 ? (
              <h1 className="text-2xl font-extrabold">{text.unavailableTitle}</h1>
            ) : (
              <h2 className="text-xl font-extrabold">{text.unavailableTitle}</h2>
            )}
            <p className="text-muted-foreground">{text.unavailableBody}</p>
          </section>
        ))}
      </main>
    );
  }

  const { definition } = survey;
  const other = definition.locales.find((l) => l !== locale);
  const otherLanguageHref = other ? (other === definition.defaultLocale ? `/s/${code}` : `/s/${code}/${other}`) : undefined;
  captureServerEvent("survey_started", `link:${survey.linkId}`, { locale });

  return (
    <main>
      <SurveyForm
        definition={definition}
        locale={locale}
        organizationName={survey.organizationName}
        locationName={survey.locationName}
        labels={labels}
        mode={{ kind: "live", code, versionId: survey.versionId }}
        otherLanguageHref={otherLanguageHref}
      />
    </main>
  );
}
