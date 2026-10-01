import { describe, expect, it } from "vitest";
import { authErrorKey, fieldErrorsFrom, resetPasswordSchema, signupSchema } from "@/modules/auth/schemas";

describe("signup validation", () => {
  it("accepts a valid sign-up and normalizes the email", () => {
    const result = signupSchema.parse({ fullName: "  نورة ", email: " Nora@Example.COM ", password: "abcdefg1" });
    expect(result).toEqual({ fullName: "نورة", email: "nora@example.com", password: "abcdefg1" });
  });

  it("returns translation keys per field", () => {
    const result = signupSchema.safeParse({ fullName: "", email: "nope", password: "short" });
    expect(result.success).toBe(false);
    expect(fieldErrorsFrom(result.error!)).toEqual({ fullName: "required", email: "email", password: "passwordMin" });
  });

  it("requires letters and digits, including Arabic letters and digits", () => {
    expect(signupSchema.safeParse({ fullName: "a", email: "a@b.co", password: "12345678" }).success).toBe(false);
    expect(signupSchema.safeParse({ fullName: "a", email: "a@b.co", password: "abcdefgh" }).success).toBe(false);
    expect(signupSchema.safeParse({ fullName: "a", email: "a@b.co", password: "كلمةسر١٢٣٤" }).success).toBe(true);
  });

  it("rejects passwords bcrypt would silently truncate", () => {
    expect(signupSchema.safeParse({ fullName: "a", email: "a@b.co", password: `a1${"x".repeat(71)}` }).success).toBe(false);
  });

  it("checks that new passwords match", () => {
    const result = resetPasswordSchema.safeParse({ password: "abcdefg1", confirmPassword: "abcdefg2" });
    expect(fieldErrorsFrom(result.error!)).toEqual({ confirmPassword: "passwordMismatch" });
  });
});

describe("authErrorKey", () => {
  it.each([
    ["invalid_credentials", "invalidCredentials"],
    ["email_not_confirmed", "emailNotConfirmed"],
    ["over_request_rate_limit", "rateLimited"],
    ["otp_expired", "linkInvalid"],
    ["something_new", "generic"],
    [undefined, "generic"],
  ])("maps %s to %s", (code, key) => {
    expect(authErrorKey(code)).toBe(key);
  });
});
