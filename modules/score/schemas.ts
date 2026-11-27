import { z } from "zod";
import { SLUG_PATTERN } from "./definition";

const optional = (schema: z.ZodString) => z.union([z.literal(""), schema]);

export const scoreSettingsSchema = z.object({
  enabled: z.boolean(),
  reviewsEnabled: z.boolean(),
  slug: optional(z.string().min(3, "slug").max(40, "slug").regex(SLUG_PATTERN, "slug")),
  about: z.string().trim().max(280, "tooLong"),
  // Stored without the scheme: "ward.sa" or "ward.sa/menu".
  website: optional(
    z
      .string()
      .max(120, "tooLong")
      .regex(/^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/, "website"),
  ),
});

export const replySchema = z.object({
  responseId: z.uuid(),
  reply: z.string().trim().max(1000, "tooLong"),
});

export const publishReviewSchema = z.object({
  submissionId: z.uuid(),
  name: z.string().trim().max(40),
});

/** "https://www.Ward.sa/" → "ward.sa" */
export const normalizeWebsite = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
