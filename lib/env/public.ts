import { posthogHost, posthogKey } from "@/lib/observability/posthog-key";
import { publicEnvSchema } from "./schema";

// NEXT_PUBLIC_* values are inlined at build time only when referenced literally, so list them one by one.
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_POSTHOG_KEY: posthogKey,
  NEXT_PUBLIC_POSTHOG_HOST: posthogHost,
  // Satis's own container. Set the variable to an empty value to turn it off (e.g. in tests).
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MLQV8C9D",
});

export const isSupabaseConfigured = () =>
  Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
