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
    client = key ? new PostHog(key, { host: serverEnv.POSTHOG_HOST ?? "https://eu.i.posthog.com", flushAt: 1, flushInterval: 0 }) : null;
  }
  return client;
}

/**
 * Captures an event from the server after the response is sent, so it never slows a request.
 * `distinctId` is our internal user or organization id, never an email.
 */
export function captureServerEvent(event: AnalyticsEvent, distinctId: string, properties: Properties = {}) {
  const posthog = getClient();
  if (!posthog) return;
  after(() => posthog.captureImmediate({ event, distinctId, properties: { ...properties, app_env: serverEnv.APP_ENV } }));
}
