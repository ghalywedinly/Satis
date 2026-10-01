import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/observability/scrub";
import { sentryDataCollection } from "@/lib/observability/sentry-options";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.APP_ENV ?? "development",
  tracesSampleRate: process.env.APP_ENV === "production" ? 0.1 : 1,
  dataCollection: sentryDataCollection,
  beforeSend: scrubEvent,
});
