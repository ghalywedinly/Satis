/**
 * Satis's PostHog project key (public by design). It is used on the live site only, so previews,
 * local development and tests send no events; set NEXT_PUBLIC_POSTHOG_KEY to override it, or to
 * an empty value to turn analytics off. NEXT_PUBLIC_* values must be referenced literally to be inlined.
 */
const SATIS_PROJECT_KEY = "phc_qjhUFcD7BCGw7brm9KabUQEz6FQCpyfqi6uKY9Mh9tmQ";

export const posthogKey: string | undefined =
  (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? (process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? SATIS_PROJECT_KEY : undefined))?.trim() ||
  undefined;
