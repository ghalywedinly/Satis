import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: "/ingest",
    defaults: "2025-05-24",
    capture_exceptions: true,
    person_profiles: "identified_only",
  });
} else if (process.env.NODE_ENV === "development") {
  console.error(
    "NEXT_PUBLIC_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_KEY is configured",
  );
}

// Runs in the browser before the app becomes interactive. Error reporting is loaded lazily and
// skipped on the public survey (/s/...) to keep that page as light as possible.
if (!window.location.pathname.startsWith("/s/")) {
  void import("./lib/observability/client").then(({ initClientObservability }) => initClientObservability());
}
