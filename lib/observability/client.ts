import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import type { AnalyticsEvent } from "./analytics-events";
import { scrubEvent } from "./scrub";
import { posthogConfigured } from "./posthog-key";
import { sentryDataCollection } from "./sentry-options";

let started = false;

/** Starts browser error reporting. */
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
  if (posthogConfigured) posthog.capture(event, properties);
}

/** Links analytics to our internal user id; contact details remain person properties. */
export function identifyClient(userId: string, properties?: { email?: string; name?: string }) {
  if (posthogConfigured) posthog.identify(userId, properties);
  Sentry.setUser({ id: userId });
}

export function resetClientIdentity() {
  if (posthogConfigured) posthog.reset();
  Sentry.setUser(null);
}
