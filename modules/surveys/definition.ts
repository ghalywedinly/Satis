import type { Locale } from "@/lib/i18n/routing";

/**
 * The survey content model, shared by the builder, the server and the public survey page.
 * Dependency-free on purpose: the public page imports it, so it must stay tiny.
 * Validation schemas live in ./schemas (server and builder only). The database validates
 * answers against the same shape (see submit_survey_response).
 */

export const QUESTION_TYPES = ["rating", "nps", "single_choice", "multiple_choice", "text"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const LIMITS = { questions: 10, options: 10, title: 200, option: 80, thankYou: 300, answerText: 1000 } as const;

export type LocalizedText = { ar?: string; en?: string };
export type Option = { id: string; label: LocalizedText };

type Base = { id: string; required: boolean; title: LocalizedText };
export type Question =
  | (Base & { type: "rating"; role?: "csat" | null })
  | (Base & { type: "nps" })
  | (Base & { type: "single_choice"; options: Option[] })
  | (Base & { type: "multiple_choice"; options: Option[] })
  | (Base & { type: "text" });
export type ChoiceQuestion = Extract<Question, { type: "single_choice" | "multiple_choice" }>;

/** Brand accents a survey can use for its buttons, selections and rating scale. */
export const ACCENTS = ["ultramarine", "ember", "mint", "grape", "ink"] as const;
/** Page grounds: brand Sand, plain white, dark Ink, or a soft tint of the accent. */
export const BACKGROUNDS = ["sand", "white", "ink", "tint"] as const;
/** How 1–5 rating questions look. All of them answer with the same 1–5 number. */
export const RATING_STYLES = ["slices", "stars", "faces", "numbers", "hearts"] as const;

export type SurveyTheme = {
  accent: (typeof ACCENTS)[number];
  background: (typeof BACKGROUNDS)[number];
  ratingStyle: (typeof RATING_STYLES)[number];
};

export const DEFAULT_THEME: SurveyTheme = { accent: "ultramarine", background: "sand", ratingStyle: "slices" };

/** Ready-made looks the builder offers as a starting point. */
export const THEME_PRESETS = {
  classic: DEFAULT_THEME,
  warm: { accent: "ember", background: "tint", ratingStyle: "faces" },
  fresh: { accent: "mint", background: "white", ratingStyle: "stars" },
  night: { accent: "ultramarine", background: "ink", ratingStyle: "numbers" },
  playful: { accent: "grape", background: "tint", ratingStyle: "hearts" },
} as const satisfies Record<string, SurveyTheme>;
export type ThemePreset = keyof typeof THEME_PRESETS;

/** The theme to render, filling gaps from older versions published before themes existed. */
export const themeOf = (theme: Partial<SurveyTheme> | undefined): SurveyTheme => ({ ...DEFAULT_THEME, ...theme });

/** What the builder saves. Text may be incomplete while editing; publishing checks completeness. */
export type SurveyDraft = {
  name: string;
  locales: Locale[];
  defaultLocale: Locale;
  questions: Question[];
  thankYou: LocalizedText;
  theme: SurveyTheme;
};

/** The frozen, published form of a survey (survey_versions.definition). */
export type SurveyDefinition = {
  questions: Question[];
  thankYou: LocalizedText;
  locales: Locale[];
  defaultLocale: Locale;
  /** Absent on versions published before survey design existed. */
  theme?: Partial<SurveyTheme>;
};

export type PublishIssue =
  | { kind: "noQuestions" }
  | { kind: "missingTitle"; questionIndex: number; locale: Locale }
  | { kind: "tooFewOptions"; questionIndex: number }
  | { kind: "missingOption"; questionIndex: number; optionIndex: number; locale: Locale };

/** Everything that must be filled in, in every enabled language, before customers can see it. */
export function publishIssues(draft: SurveyDraft): PublishIssue[] {
  const issues: PublishIssue[] = [];
  if (draft.questions.length === 0) issues.push({ kind: "noQuestions" });
  draft.questions.forEach((question, questionIndex) => {
    for (const locale of draft.locales) {
      if (!question.title[locale]?.trim()) issues.push({ kind: "missingTitle", questionIndex, locale });
    }
    if (question.type === "single_choice" || question.type === "multiple_choice") {
      if (question.options.length < 2) issues.push({ kind: "tooFewOptions", questionIndex });
      question.options.forEach((option, optionIndex) => {
        for (const locale of draft.locales) {
          if (!option.label[locale]?.trim()) issues.push({ kind: "missingOption", questionIndex, optionIndex, locale });
        }
      });
    }
  });
  return issues;
}

/** Text in the requested language, falling back to the survey's default. */
export const textIn = (text: LocalizedText, locale: Locale, fallback: Locale) => text[locale]?.trim() || text[fallback]?.trim() || "";

/** One answer per question id, in the shape submit_survey_response expects. */
export type Answer = { number: number } | { options: string[] } | { text: string };
export type Answers = Record<string, Answer>;

/** Client-side check before submitting: which required questions are still unanswered. */
export function unansweredRequired(questions: Question[], answers: Answers): string[] {
  return questions
    .filter((q) => q.required)
    .filter((q) => {
      const a = answers[q.id];
      if (!a) return true;
      if ("text" in a) return a.text.trim() === "";
      if ("options" in a) return a.options.length === 0;
      return false;
    })
    .map((q) => q.id);
}
