import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import type { Logger } from "@opentelemetry/api-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import * as Sentry from "@sentry/nextjs";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const isNodeRuntime = process.env.NEXT_RUNTIME === "nodejs";

if (isNodeRuntime && process.env.NODE_ENV !== "production") {
  if (!posthogKey) {
    console.warn("NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured");
  } else if (!posthogHost) {
    console.warn("NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured");
  }
}

/** Dedicated provider: only the purpose-written logger below is exported to PostHog Logs. */
export const posthogLoggerProvider =
  isNodeRuntime && posthogKey && posthogHost
    ? new LoggerProvider({
        resource: resourceFromAttributes({
          "service.name": "satis",
          "deployment.environment": process.env.APP_ENV ?? process.env.NODE_ENV ?? "development",
        }),
        processors: [
          new BatchLogRecordProcessor({
            exporter: new OTLPLogExporter({
              url: `${posthogHost.replace(/\/$/, "")}/i/v1/logs`,
              headers: {
                Authorization: `Bearer ${posthogKey}`,
                "Content-Type": "application/json",
              },
            }),
          }),
        ],
      })
    : null;

const posthogLogger = posthogLoggerProvider?.getLogger("satis.posthog");

/** Returns the dedicated PostHog logger without attaching application loggers to its exporter. */
export function getPostHogLogger(): Logger | null {
  return posthogLogger ?? null;
}

/** Best-effort post-response delivery for short-lived Next.js executions. */
export async function flushPostHogLogs() {
  if (posthogLoggerProvider) await posthogLoggerProvider.forceFlush().catch(() => {});
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Staging and production refuse to start with missing configuration.
    const { assertDeployedEnv } = await import("./lib/env/server");
    assertDeployedEnv();
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Reports errors thrown while rendering Server Components, Route Handlers and Server Actions.
export const onRequestError = Sentry.captureRequestError;
