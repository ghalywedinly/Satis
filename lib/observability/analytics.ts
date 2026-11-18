import "server-only";
import { after } from "next/server";
import { PostHog } from "posthog-node";
import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";

import type { AnalyticsEvent } from "./analytics-events";

type Properties = Record<string, string | number | boolean | null>;

let client: PostHog | null | undefined;
function getClient() {
  if (client === undefined) {
    const key = publicEnv.NEXT_PUBLIC_POSTHOG_KEY;
    client = key
      ? new PostHog(key, {
          host: serverEnv.POSTHOG_HOST ?? publicEnv.NEXT_PUBLIC_POSTHOG_HOST,
          flushAt: 1,
          flushInterval: 0,
          requestTimeout: 2_000,
          fetchRetryCount: 0,
          privacyMode: false,
        })
      : null;
  }
  return client;
}

/** Shared by product analytics and AI wrappers so both use the configured project. */
export function getPostHogClient() {
  return getClient();
}

/** Safely deliver server-side captures before a short-lived server action or route returns. */
export async function flushPostHog() {
  const posthog = getClient();
  if (posthog) await posthog.flush().catch(() => {});
}

/**
 * Captures an event from the server after the response is sent, so it never slows a request.
 * Authenticated events use an internal user id; public actions remain personless.
 */
export function captureServerEvent(event: AnalyticsEvent, distinctId?: string, properties: Properties = {}) {
  const posthog = getClient();
  if (!posthog) return;
  after(() => {
    const eventProperties = { ...properties, app_env: serverEnv.APP_ENV };
    if (distinctId) {
      return posthog.captureImmediate({ event, distinctId, properties: eventProperties }).catch(() => {});
    }
    return posthog
      .captureImmediate({ event, properties: eventProperties } as Parameters<typeof posthog.captureImmediate>[0])
      .catch(() => {});
  });
}
