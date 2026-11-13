import "server-only";
import { after } from "next/server";
import { PostHog } from "posthog-node";
import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";

import type { AnalyticsEvent } from "./analytics-events";

type Properties = Record<string, string | number | boolean | null>;

let client: PostHog | null | undefined;
export function getPostHogClient() {
  if (client === undefined) {
    const key = publicEnv.NEXT_PUBLIC_POSTHOG_KEY;
    const host = serverEnv.POSTHOG_HOST;
    if (!key && process.env.NODE_ENV !== "production") {
      console.warn("NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured");
    }
    if (!host && process.env.NODE_ENV !== "production") {
      console.warn("POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_HOST is configured");
    }
    client = key && host
      ? new PostHog(key, {
          host,
          flushAt: 1,
          flushInterval: 0,
          requestTimeout: 2_000,
          fetchRetryCount: 0,
          privacyMode: false,
          enableExceptionAutocapture: process.env.NEXT_RUNTIME === "nodejs",
        })
      : null;
  }
  return client;
}

/** Flushes serverless analytics without allowing delivery failures to affect application work. */
export async function flushPostHog() {
  const posthog = getPostHogClient();
  if (!posthog) return;
  await posthog.flush().catch(() => {});
}

/**
 * Captures an event from the server after the response is sent, so it never slows a request.
 * `distinctId` is our internal user or organization id, never an email.
 */
export function captureServerEvent(event: AnalyticsEvent, distinctId: string, properties: Properties = {}) {
  const posthog = getPostHogClient();
  if (!posthog) return;
  after(() => posthog.captureImmediate({ event, distinctId, properties: { ...properties, app_env: serverEnv.APP_ENV } }));
}
