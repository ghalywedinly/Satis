import "server-only";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";

type LogAttributes = Record<string, string | number | boolean>;

let loggerProvider: LoggerProvider | null | undefined;
let shutdownHandlerRegistered = false;

function getLoggerProvider() {
  if (loggerProvider !== undefined) return loggerProvider;

  const key = publicEnv.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured",
      );
    }
    loggerProvider = null;
    return loggerProvider;
  }

  const host = serverEnv.POSTHOG_HOST;
  if (!host) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_HOST is configured",
      );
    }
    loggerProvider = null;
    return loggerProvider;
  }

  loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({
      "service.name": "satis-web",
      "deployment.environment": serverEnv.APP_ENV,
    }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: new URL("i/v1/logs", `${host}/`).toString(),
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          timeoutMillis: 2_000,
        }),
      }),
    ],
  });

  return loggerProvider;
}

/** Starts the dedicated PostHog log exporter without changing existing loggers or tracing. */
export function initializePostHogLogs() {
  const provider = getLoggerProvider();
  if (!provider || shutdownHandlerRegistered) return;

  shutdownHandlerRegistered = true;
  const shutdown = () => {
    void provider.shutdown().catch(() => {});
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

/** Emits only purpose-written application logs through this integration's dedicated provider. */
export function emitPostHogLog(body: string, severityNumber: SeverityNumber, attributes: LogAttributes) {
  const provider = getLoggerProvider();
  provider?.getLogger("satis-posthog").emit({ body, severityNumber, attributes });
}

export async function flushPostHogLogs() {
  await getLoggerProvider()?.forceFlush().catch(() => {});
}
