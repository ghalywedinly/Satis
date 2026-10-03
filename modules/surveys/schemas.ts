import { z } from "zod";
import { LIMITS, type Answers, type Question, type SurveyDraft } from "./definition";

const localized = (max: number) =>
  z.object({ ar: z.string().max(max).optional(), en: z.string().max(max).optional() }).strict();

const optionSchema = z.object({ id: z.uuid(), label: localized(LIMITS.option) }).strict();
const base = { id: z.uuid(), required: z.boolean(), title: localized(LIMITS.title) };

export const questionSchema: z.ZodType<Question> = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("rating"), role: z.enum(["csat"]).nullable().optional() }).strict(),
  z.object({ ...base, type: z.literal("nps") }).strict(),
  z.object({ ...base, type: z.literal("single_choice"), options: z.array(optionSchema).max(LIMITS.options) }).strict(),
  z.object({ ...base, type: z.literal("multiple_choice"), options: z.array(optionSchema).max(LIMITS.options) }).strict(),
  z.object({ ...base, type: z.literal("text") }).strict(),
]);

const localeSchema = z.enum(["ar", "en"]);

export const draftSchema: z.ZodType<SurveyDraft> = z
  .object({
    name: z.string().trim().min(1).max(120),
    locales: z.array(localeSchema).min(1).max(2),
    defaultLocale: localeSchema,
    questions: z.array(questionSchema).max(LIMITS.questions),
    thankYou: localized(LIMITS.thankYou),
  })
  .refine((d) => d.locales.includes(d.defaultLocale), { path: ["defaultLocale"] })
  .refine((d) => new Set(d.questions.map((q) => q.id)).size === d.questions.length, { path: ["questions"] });

export const answersSchema: z.ZodType<Answers> = z.record(
  z.uuid(),
  z.union([
    z.object({ number: z.number().int().min(0).max(10) }).strict(),
    z.object({ options: z.array(z.uuid()).min(1).max(LIMITS.options) }).strict(),
    z.object({ text: z.string().max(LIMITS.answerText) }).strict(),
  ]),
);
