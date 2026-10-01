"use server";

import { redirect } from "next/navigation";
import { HOME_PATH } from "@/lib/auth/routes";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured, publicEnv } from "@/lib/env/public";
import { getPathname } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { reportError } from "@/lib/observability/errors";
import { captureServerEvent } from "@/lib/observability/analytics";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  authErrorKey,
  fieldErrorsFrom,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type FormState,
} from "./schemas";
import { getPendingEmail, setPendingEmail } from "./pending-email";

const siteUrl = () => publicEnv.NEXT_PUBLIC_SITE_URL;
const path = (locale: Locale, href: string) => getPathname({ locale, href });
const absolute = (locale: Locale, href: string) => new URL(path(locale, href), siteUrl()).toString();
const asLocale = (value: unknown): Locale =>
  routing.locales.includes(value as Locale) ? (value as Locale) : routing.defaultLocale;
const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

export type LoginField = "email" | "password";
export type SignupField = "fullName" | "email" | "password";
export type ForgotField = "email";
export type ResetField = "password" | "confirmPassword";

export async function logIn(locale: Locale, _prev: FormState<LoginField>, formData: FormData): Promise<FormState<LoginField>> {
  if (!isSupabaseConfigured()) return { status: "error", formError: "notConfigured" };
  const raw = { email: text(formData, "email"), password: text(formData, "password") };
  const values = { email: raw.email };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  if (!(await consumeRateLimit("login", await clientIp()))) return { status: "error", formError: "rateLimited", values };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { status: "error", formError: authErrorKey(error?.code), values };

  // Continue where the user was going, otherwise to the dashboard in their saved language.
  const next = safeRedirectPath(text(formData, "next"), siteUrl());
  if (next) redirect(next);
  const { data: profile } = await supabase.from("profiles").select("locale").eq("id", data.user.id).maybeSingle();
  redirect(path(profile?.locale ?? locale, HOME_PATH));
}

export async function signUp(locale: Locale, _prev: FormState<SignupField>, formData: FormData): Promise<FormState<SignupField>> {
  if (!isSupabaseConfigured()) return { status: "error", formError: "notConfigured" };
  const raw = { fullName: text(formData, "fullName"), email: text(formData, "email"), password: text(formData, "password") };
  const values = { fullName: raw.fullName, email: raw.email };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };

  if (!(await consumeRateLimit("signup", await clientIp()))) return { status: "error", formError: "rateLimited", values };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by the database trigger that creates the profile, and by the auth email hook.
      data: { full_name: parsed.data.fullName, locale },
      // After verifying, continue where they were going (e.g. an invitation), else the dashboard.
      emailRedirectTo: new URL(safeRedirectPath(text(formData, "next"), siteUrl()) ?? path(locale, HOME_PATH), siteUrl()).toString(),
    },
  });
  if (error) {
    const key = authErrorKey(error.code);
    if (key === "generic") reportError(error, { area: "auth", action: "signup" });
    return { status: "error", formError: key, values };
  }

  if (data.user) captureServerEvent("signup_completed", data.user.id, { locale });
  await setPendingEmail(parsed.data.email);
  redirect(path(locale, "/verify-email"));
}

export async function resendVerification(locale: Locale): Promise<FormState<never>> {
  if (!isSupabaseConfigured()) return { status: "error", formError: "notConfigured" };
  const email = await getPendingEmail();
  if (!email) return { status: "error", formError: "generic" };
  if (!(await consumeRateLimit("resendVerification", await clientIp()))) return { status: "error", formError: "rateLimited" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: absolute(locale, HOME_PATH) },
  });
  if (error) return { status: "error", formError: authErrorKey(error.code) };
  return { status: "success" };
}

export async function requestPasswordReset(
  locale: Locale,
  _prev: FormState<ForgotField>,
  formData: FormData,
): Promise<FormState<ForgotField>> {
  if (!isSupabaseConfigured()) return { status: "error", formError: "notConfigured" };
  const raw = { email: text(formData, "email") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };

  if (!(await consumeRateLimit("passwordReset", await clientIp()))) return { status: "error", formError: "rateLimited", values: raw };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: absolute(locale, "/reset-password"),
  });
  // Same answer whether or not the account exists, so the form can't be used to discover accounts.
  if (error && authErrorKey(error.code) === "rateLimited") return { status: "error", formError: "rateLimited", values: raw };
  if (error) reportError(error, { area: "auth", action: "password-reset" });
  return { status: "success" };
}

export async function updatePassword(locale: Locale, _prev: FormState<ResetField>, formData: FormData): Promise<FormState<ResetField>> {
  if (!isSupabaseConfigured()) return { status: "error", formError: "notConfigured" };
  const parsed = resetPasswordSchema.safeParse({
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", formError: authErrorKey(error.code) };
  redirect(path(locale, HOME_PATH));
}

export async function logOut(locale: Locale) {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect(path(locale, "/"));
}

/** Saves the dashboard/email language for the signed-in user. Signed-out visitors just switch the URL. */
export async function saveLocalePreference(locale: unknown) {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ locale: asLocale(locale) }).eq("id", user.id);
  if (error) reportError(error, { area: "profile", action: "save-locale" });
}
