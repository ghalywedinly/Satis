import type { ErrorEvent } from "@sentry/nextjs";

const SENSITIVE_KEYS = /pass(word)?|token|secret|authorization|cookie|api[-_]?key|email|phone/i;

/**
 * Removes personal data and credentials from Sentry events before they leave the app:
 * cookies, auth headers, query strings, user email/IP, and any field whose name looks sensitive.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      event.request.headers = Object.fromEntries(
        Object.entries(event.request.headers).filter(([key]) => !SENSITIVE_KEYS.test(key)),
      );
    }
    if (event.request.url) event.request.url = event.request.url.split("?")[0];
    delete event.request.query_string;
  }
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  if (event.extra) event.extra = redact(event.extra) as typeof event.extra;
  return event;
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, SENSITIVE_KEYS.test(key) ? "[redacted]" : redact(v)]),
    );
  }
  return value;
}
