import { NextResponse, type NextRequest } from "next/server";
import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { buildAuthEmail, type AuthEmailKind } from "@/lib/email/auth-emails";
import { getEmailProvider } from "@/lib/email/provider";
import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";
import { routing, type Locale } from "@/lib/i18n/routing";
import { reportError } from "@/lib/observability/errors";

/**
 * Supabase Auth "Send Email" hook. Supabase calls this instead of sending its own
 * (single-language) emails, so every auth email goes out in the user's language.
 * Requests are signed (Standard Webhooks); anything unsigned is rejected.
 */

type HookPayload = {
  user: { email: string; new_email?: string; user_metadata?: { locale?: string } };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new: string;
    token_hash_new: string;
  };
};

const KINDS: Record<string, AuthEmailKind> = {
  signup: "signup",
  recovery: "recovery",
  magiclink: "magicLink",
  email_change: "emailChange",
  reauthentication: "reauthentication",
};

const hookError = (status: number, message: string) =>
  NextResponse.json({ error: { http_code: status, message } }, { status });

export async function POST(request: NextRequest) {
  const secret = serverEnv.AUTH_EMAIL_HOOK_SECRET;
  if (!secret) return hookError(500, "Email hook is not configured");

  const body = await request.text();
  let payload: HookPayload;
  try {
    payload = new Webhook(secret.replace("v1,whsec_", "")).verify(body, Object.fromEntries(request.headers)) as HookPayload;
  } catch (error) {
    if (error instanceof WebhookVerificationError) return hookError(401, "Invalid signature");
    throw error;
  }

  const { user, email_data: data } = payload;
  const kind = KINDS[data.email_action_type];
  if (!kind) return hookError(400, `Unsupported email action: ${data.email_action_type}`);

  const requested = user.user_metadata?.locale;
  const locale: Locale = routing.locales.includes(requested as Locale) ? (requested as Locale) : routing.defaultLocale;
  const confirmUrl = (tokenHash: string) => {
    const url = new URL("/auth/confirm", publicEnv.NEXT_PUBLIC_SITE_URL);
    url.searchParams.set("token_hash", tokenHash);
    url.searchParams.set("type", data.email_action_type);
    url.searchParams.set("lang", locale);
    if (data.redirect_to) url.searchParams.set("next", data.redirect_to);
    return url.toString();
  };

  try {
    const provider = getEmailProvider();
    if (kind === "reauthentication") {
      await provider.send(await buildAuthEmail(kind, locale, user.email, { code: data.token }));
    } else if (kind === "emailChange") {
      // Supabase's naming is inverted here: token_hash belongs to the NEW address,
      // token_hash_new to the CURRENT one (sent only when secure email change is on).
      if (user.new_email && data.token_hash) {
        await provider.send(await buildAuthEmail(kind, locale, user.new_email, { url: confirmUrl(data.token_hash) }));
      }
      if (data.token_hash_new) {
        await provider.send(await buildAuthEmail(kind, locale, user.email, { url: confirmUrl(data.token_hash_new) }));
      }
    } else {
      await provider.send(await buildAuthEmail(kind, locale, user.email, { url: confirmUrl(data.token_hash) }));
    }
  } catch (error) {
    reportError(error, { area: "auth-email-hook", kind });
    return hookError(500, "Failed to send email");
  }

  return NextResponse.json({});
}
