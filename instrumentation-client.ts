// Runs in the browser before the app becomes interactive. Error reporting and analytics are
// loaded lazily and skipped on the public survey (/s/...) to keep that page as light as possible.
if (!window.location.pathname.startsWith("/s/")) {
  void import("./lib/observability/client").then(({ initClientObservability }) => initClientObservability());
}
