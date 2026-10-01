import { z } from "zod";

// Empty strings in .env files mean "not set".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

export const appEnvSchema = z.enum(["development", "staging", "production"]);

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: optional(z.url()),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optional(z.string().min(1)),
  NEXT_PUBLIC_SENTRY_DSN: optional(z.url()),
  NEXT_PUBLIC_POSTHOG_KEY: optional(z.string().min(1)),
});

export const serverEnvSchema = z.object({
  APP_ENV: appEnvSchema.default("development"),
  SUPABASE_SECRET_KEY: optional(z.string().min(1)),
  AUTH_EMAIL_HOOK_SECRET: optional(z.string().startsWith("v1,whsec_")),
  RESEND_API_KEY: optional(z.string().min(1)),
  EMAIL_FROM: optional(z.string().min(3)),
  POSTHOG_HOST: optional(z.url()),
  RATE_LIMIT_SALT: optional(z.string().min(16)),
  EMAIL_OUTBOX_DIR: optional(z.string()),
  /** Development only: turns off rate limiting for automated tests. Rejected in staging/production. */
  RATE_LIMIT_DISABLED: z.preprocess((v) => v === "true", z.boolean()).default(false),
});

/** Variables that must be present outside local development. */
export const requiredInDeployedEnvs = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "AUTH_EMAIL_HOOK_SECRET",
  "RATE_LIMIT_SALT",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_POSTHOG_KEY",
] as const;
