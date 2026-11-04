import { z } from "zod";
import type { ValidationKey } from "@/lib/forms";
import { emailSchema } from "@/modules/auth/schemas";

const msg = (key: ValidationKey) => key;

/**
 * A mobile number in international form ("+966551234567"). Accepts how people type it:
 * spaces and dashes, Arabic-Indic digits, "00" for "+", and Saudi numbers starting 05 or 5.
 * Saudi numbers must be mobiles (+9665…). Returns null when it can't be a phone number.
 */
export function normalizePhone(raw: string): string | null {
  let digits = raw
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x6f0))
    .replace(/[\s\-().‎‏⁦-⁩]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (/^05\d{8}$/.test(digits)) digits = `+966${digits.slice(1)}`;
  else if (/^5\d{8}$/.test(digits)) digits = `+966${digits}`;
  if (!/^\+\d{8,15}$/.test(digits)) return null;
  if (digits.startsWith("+966") && !/^\+9665\d{8}$/.test(digits)) return null;
  return digits;
}

export const bookingSchema = z.object({
  startsAt: z.iso.datetime({ offset: true, message: msg("pickTime") }),
  fullName: z.string().trim().min(2, msg("required")).max(120, msg("tooLong")),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .min(1, msg("required"))
    .max(40, msg("phone"))
    .transform((value, ctx) => {
      const phone = normalizePhone(value);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: msg("phone") });
        return z.NEVER;
      }
      return phone;
    }),
  company: z.string().trim().min(1, msg("required")).max(120, msg("tooLong")),
});

export type BookingField = "startsAt" | "fullName" | "email" | "phone" | "company";
