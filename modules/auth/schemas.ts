import { z } from "zod";
import type { Messages } from "@/locales";

/** Validation messages are translation keys under `validation.*`, translated where they're shown. */
export type ValidationKey = keyof Messages["validation"];
export type AuthErrorKey = Exclude<keyof Messages["errors"], "notFound" | "page">;

const msg = (key: ValidationKey) => key;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, msg("required"))
  .max(254, msg("tooLong"))
  .pipe(z.email(msg("email")));

// Mirrors the Supabase Auth policy in supabase/config.toml (8+ chars, letters and digits).
// bcrypt only uses the first 72 bytes, so longer passwords are rejected rather than silently truncated.
export const newPasswordSchema = z
  .string()
  .min(8, msg("passwordMin"))
  .max(72, msg("passwordMax"))
  .regex(/\p{L}/u, msg("passwordLettersDigits"))
  .regex(/\p{Nd}/u, msg("passwordLettersDigits"));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, msg("required")).max(72, msg("passwordMax")),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, msg("required")).max(120, msg("tooLong")),
  email: emailSchema,
  password: newPasswordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: newPasswordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { message: msg("passwordMismatch"), path: ["confirmPassword"] });

export type FormState<Field extends string> = {
  status: "idle" | "error" | "success";
  fieldErrors?: Partial<Record<Field, ValidationKey>>;
  formError?: AuthErrorKey;
  /** Non-secret values echoed back so the form keeps them after a failed submit. */
  values?: Partial<Record<Field, string>>;
};

export function fieldErrorsFrom<Field extends string>(error: z.ZodError): Partial<Record<Field, ValidationKey>> {
  const out: Partial<Record<Field, ValidationKey>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as Field;
    if (field && !out[field]) out[field] = issue.message as ValidationKey;
  }
  return out;
}

/** Maps Supabase Auth error codes to our translated messages. */
export function authErrorKey(code: string | undefined): AuthErrorKey {
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "user_already_exists":
    case "email_exists":
      return "userExists";
    case "weak_password":
      return "weakPassword";
    case "same_password":
      return "samePassword";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    case "otp_expired":
    case "flow_state_expired":
    case "bad_jwt":
      return "linkInvalid";
    case "session_not_found":
    case "session_expired":
    case "refresh_token_not_found":
      return "sessionExpired";
    default:
      return "generic";
  }
}
