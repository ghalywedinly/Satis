import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import type { AnalyticsEvent } from "./analytics-events";
import { scrubEvent } from "./scrub";
import { sentryDataCollection } from "./sentry-options";

let started = false;

/** Starts error reporting and product analytics in the browser. Both are no-ops without keys. */
export function initClientObservability() {
  if (started) return;
  started = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      tunnel: "/monitoring",
      tracesSampleRate: 0.1,
      dataCollection: sentryDataCollection,
      beforeSend: scrubEvent,
    });
  }
}

export function trackClient(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>) {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, properties);
}

/** Links analytics to our internal user id (never an email). */
export function identifyClient(userId: string, email: string | null) {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.identify(userId, email ? { email } : undefined);
  Sentry.setUser({ id: userId, email: email ?? undefined });
}

export function resetClientIdentity() {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.reset();
  Sentry.setUser(null);
}
