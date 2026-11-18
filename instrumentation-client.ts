import posthog from "posthog-js";
import { posthogHost, posthogKey } from "./lib/observability/posthog-key";

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: "/ingest",
    ui_host: posthogHost.replace(".i.", "."),
    defaults: "2025-05-24",
    capture_exceptions: true,
    person_profiles: "identified_only",
    tracing_headers: [window.location.hostname],
  });
} else if (process.env.NODE_ENV === "development") {
  if (!posthogKey) {
    console.error(
      "NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured",
    );
  }
  if (!posthogHost) {
    console.error(
      "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured",
    );
  }
}

// Error reporting remains lazy and is skipped on the public survey (/s/...) to keep that page light.
if (!window.location.pathname.startsWith("/s/")) {
  void import("./lib/observability/client").then(({ initClientObservability }) => initClientObservability());
}
