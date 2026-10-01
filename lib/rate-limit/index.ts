import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { serverEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability/errors";

export type RateLimitRule = { limit: number; windowSeconds: number };

export const RATE_LIMITS = {
  login: { limit: 10, windowSeconds: 300 },
  signup: { limit: 5, windowSeconds: 3600 },
  passwordReset: { limit: 5, windowSeconds: 3600 },
  resendVerification: { limit: 5, windowSeconds: 3600 },
  // Generous: a café's customers often share one Wi-Fi address.
  surveySubmit: { limit: 30, windowSeconds: 600 },
} satisfies Record<string, RateLimitRule>;

/**
 * Visitor IP from the platform's forwarding header. On Vercel, x-forwarded-for is set by
 * the edge and can't be spoofed by the client; elsewhere, put a trusted proxy in front.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Counts one attempt for `action` by `identifier` (usually the IP) and returns whether it's allowed.
 * Identifiers are hashed with a secret salt, so raw IPs never reach the database.
 * Fails open (allows) if the limiter itself is unavailable, and reports the failure.
 */
export async function consumeRateLimit(action: keyof typeof RATE_LIMITS, identifier: string): Promise<boolean> {
  if (serverEnv.RATE_LIMIT_DISABLED && serverEnv.APP_ENV === "development") return true;
  const rule = RATE_LIMITS[action];
  const supabase = createSupabaseAdminClient();
  const salt = serverEnv.RATE_LIMIT_SALT;
  if (!supabase || !salt) return true; // local development without secrets; deployed envs require both

  const key = `${action}:${createHash("sha256").update(`${salt}:${identifier}`).digest("hex")}`;
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_key: key,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });
  if (error) {
    reportError(error, { area: "rate-limit", action });
    return true;
  }
  return data === true;
}
