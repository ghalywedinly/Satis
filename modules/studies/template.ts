import "server-only";
import { randomUUID } from "node:crypto";
import { getTranslations } from "next-intl/server";
import { DEFAULT_THEME, type SurveyDraft } from "@/modules/surveys/definition";
import { buildTemplateDraft } from "@/modules/surveys/template";

const FREQUENCY = ["never", "sometimes", "often", "always"] as const;

export type StudyTemplate = "research" | "satisfaction";

/** Starting questions for a study's pre- and post-survey, in both languages. */
export async function buildStudyDraft(template: StudyTemplate, defaultLocale: "ar" | "en"): Promise<SurveyDraft> {
  if (template === "satisfaction") {
    // The everyday post-visit survey, without marking a CSAT question (studies stay out of CSAT).
    const draft = await buildTemplateDraft(defaultLocale);
    return { ...draft, questions: draft.questions.map((q) => (q.type === "rating" ? { ...q, role: null } : q)) };
  }
  const [ar, en] = await Promise.all([
    getTranslations({ locale: "ar", namespace: "studies.template" }),
    getTranslations({ locale: "en", namespace: "studies.template" }),
  ]);
  const both = (key: Parameters<typeof ar>[0]) => ({ ar: ar(key), en: en(key) });
  return {
    name: (defaultLocale === "ar" ? ar : en)("name"),
    locales: ["ar", "en"],
    defaultLocale,
    questions: [
      { id: randomUUID(), type: "rating", required: true, role: null, title: both("knowledge") },
      { id: randomUUID(), type: "rating", required: true, role: null, title: both("confidence") },
      {
        id: randomUUID(),
        type: "single_choice",
        required: false,
        title: both("frequency"),
        options: FREQUENCY.map((key) => ({ id: randomUUID(), label: both(`options.${key}`) })),
      },
      { id: randomUUID(), type: "text", required: false, title: both("comment") },
    ],
    thankYou: both("thankYou"),
    theme: DEFAULT_THEME,
  };
}
