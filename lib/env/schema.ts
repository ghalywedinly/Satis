import { z } from "zod";

/** Strips whitespace and wrapping quotes, which creep in when values are pasted into a dashboard. */
export const clean = (v: unknown) => (typeof v === "string" ? v.trim().replace(/^(["'])(.*)\1$/, "$2").trim() : v);

// Empty strings in .env files mean "not set".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (clean(v) === "" ? undefined : clean(v)), schema.optional());

export const appEnvSchema = z.enum(["development", "staging", "production"]);

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.preprocess(clean, z.url()),
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
  /** AI analysis (Phase 7). "fake" is a keyword-based stand-in for development and tests only. */
  AI_PROVIDER: optional(z.enum(["anthropic", "fake"])),
  AI_MODEL: optional(z.string().min(1)),
  ANTHROPIC_API_KEY: optional(z.string().min(1)),
  /** Shared secret Vercel Cron sends to /api/cron/* routes. */
  CRON_SECRET: optional(z.string().min(16)),
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
