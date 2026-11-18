/** NEXT_PUBLIC_* values must be referenced literally to be inlined into the browser bundle. */
export const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined;
export const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || undefined;
export const posthogConfigured = Boolean(posthogKey && posthogHost);
