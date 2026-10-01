import { describe, expect, it } from "vitest";
import { publishIssues, textIn, unansweredRequired, type Question, type SurveyDraft } from "@/modules/surveys/definition";
import { newPublicCode } from "@/modules/surveys/links";
import { answersSchema, draftSchema } from "@/modules/surveys/schemas";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const rating: Question = { id: id(1), type: "rating", required: true, role: "csat", title: { ar: "كيف كانت زيارتك؟", en: "How was it?" } };
const choice: Question = {
  id: id(2),
  type: "single_choice",
  required: false,
  title: { ar: "اختر", en: "Pick" },
  options: [
    { id: id(3), label: { ar: "أ", en: "A" } },
    { id: id(4), label: { ar: "ب" } },
  ],
};
const draft: SurveyDraft = { name: "S", locales: ["ar", "en"], defaultLocale: "ar", questions: [rating, choice], thankYou: {} };

describe("publishing rules", () => {
  it("requires text in every enabled language", () => {
    expect(publishIssues(draft)).toEqual([{ kind: "missingOption", questionIndex: 1, optionIndex: 1, locale: "en" }]);
    expect(publishIssues({ ...draft, locales: ["ar"] })).toEqual([]);
  });

  it("requires questions and at least two options per choice question", () => {
    expect(publishIssues({ ...draft, questions: [] })).toEqual([{ kind: "noQuestions" }]);
    const oneOption = { ...choice, options: choice.options.slice(0, 1) };
    expect(publishIssues({ ...draft, locales: ["ar"], questions: [oneOption] })).toContainEqual({ kind: "tooFewOptions", questionIndex: 0 });
  });
});

describe("answers", () => {
  it("lists unanswered required questions, treating blank comments as unanswered", () => {
    const comment: Question = { id: id(5), type: "text", required: true, title: { ar: "؟" } };
    expect(unansweredRequired([rating, choice, comment], { [id(5)]: { text: "  " } })).toEqual([id(1), id(5)]);
    expect(unansweredRequired([rating], { [id(1)]: { number: 4 } })).toEqual([]);
  });

  it("validates the answer payload shape", () => {
    expect(answersSchema.safeParse({ [id(1)]: { number: 5 } }).success).toBe(true);
    expect(answersSchema.safeParse({ [id(1)]: { number: 2.5 } }).success).toBe(false);
    expect(answersSchema.safeParse({ "not-a-uuid": { number: 5 } }).success).toBe(false);
    expect(answersSchema.safeParse({ [id(1)]: { text: "x".repeat(1001) } }).success).toBe(false);
  });

  it("falls back to the survey's default language", () => {
    expect(textIn({ ar: "مرحبًا" }, "en", "ar")).toBe("مرحبًا");
    expect(textIn({ ar: "مرحبًا", en: "Hi" }, "en", "ar")).toBe("Hi");
  });
});

describe("draft validation", () => {
  it("accepts a valid draft and rejects malformed ones", () => {
    expect(draftSchema.safeParse(draft).success).toBe(true);
    expect(draftSchema.safeParse({ ...draft, defaultLocale: "en", locales: ["ar"] }).success).toBe(false);
    expect(draftSchema.safeParse({ ...draft, questions: [rating, rating] }).success).toBe(false);
    expect(draftSchema.safeParse({ ...draft, questions: [{ ...rating, type: "slider" }] }).success).toBe(false);
  });
});

describe("public codes", () => {
  it("are 8 unambiguous characters", () => {
    for (let i = 0; i < 200; i++) expect(newPublicCode()).toMatch(/^[2-9a-km-zA-HJ-NP-Z]{8}$/);
  });
});
