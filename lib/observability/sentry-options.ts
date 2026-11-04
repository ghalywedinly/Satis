import type { DataCollection } from "@sentry/core";

/**
 * Privacy-first Sentry collection: no cookies, bodies, query strings, user info or DB data.
 * Business and customer data must never leave in error reports (spec §28).
 */
export const sentryDataCollection: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { allow: ["user-agent", "accept-language", "referer"] }, response: false },
  httpBodies: [],
  urlQueryParams: false,
  databaseQueryData: false,
  genAI: { inputs: false, outputs: false },
};
