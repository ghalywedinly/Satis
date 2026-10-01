import "server-only";
import { randomUUID } from "node:crypto";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import type { SurveyDraft } from "./definition";

const OPTION_KEYS = ["service", "staff", "speed", "cleanliness", "value"] as const;

/** The ready-made post-visit survey, written in both languages, that new surveys start from. */
export async function buildTemplateDraft(defaultLocale: Locale): Promise<SurveyDraft> {
  const [ar, en] = await Promise.all([
    getTranslations({ locale: "ar", namespace: "surveyTemplate" }),
    getTranslations({ locale: "en", namespace: "surveyTemplate" }),
  ]);
  const both = (key: Parameters<typeof ar>[0]) => ({ ar: ar(key), en: en(key) });

  return {
    name: (defaultLocale === "ar" ? ar : en)("name"),
    locales: ["ar", "en"],
    defaultLocale,
    questions: [
      { id: randomUUID(), type: "rating", required: true, role: "csat", title: both("rating") },
      {
        id: randomUUID(),
        type: "multiple_choice",
        required: false,
        title: both("liked"),
        options: OPTION_KEYS.map((key) => ({ id: randomUUID(), label: both(`options.${key}`) })),
      },
      { id: randomUUID(), type: "nps", required: false, title: both("nps") },
      { id: randomUUID(), type: "text", required: false, title: both("comment") },
    ],
    thankYou: both("thankYou"),
  };
}
