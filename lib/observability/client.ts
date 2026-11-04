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

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key) {
    posthog.init(key, {
      api_host: "/ingest",
      ui_host: "https://eu.posthog.com",
      defaults: "2025-05-24",
      person_profiles: "identified_only",
      // Explicit events only: autocapture and recordings could pick up customer feedback text.
      autocapture: false,
      disable_session_recording: true,
      capture_pageleave: false,
    });
  }
}

export function trackClient(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>) {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.capture(event, properties);
}

/** Links analytics to our internal user id (never an email). */
export function identifyClient(userId: string) {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.identify(userId);
  Sentry.setUser({ id: userId });
}

export function resetClientIdentity() {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) posthog.reset();
  Sentry.setUser(null);
}
