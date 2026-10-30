import * as Sentry from "@sentry/nextjs";

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
