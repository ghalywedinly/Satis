import * as Sentry from "@sentry/nextjs";

/** Reports a handled error to Sentry (no-op when Sentry isn't configured). Never include personal data in context. */
export function reportError(error: unknown, context?: Record<string, string | number | boolean>) {
  Sentry.captureException(error, context ? { tags: context } : undefined);
  if (process.env.NODE_ENV !== "production") console.error(error, context);
}
