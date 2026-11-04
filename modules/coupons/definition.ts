import { formatPercent, formatSar } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import type { LocalizedText } from "@/modules/surveys/definition";

/**
 * A coupon as the customer and staff see it. Dependency-free on purpose: the public
 * survey page imports it. The database is the source of truth (see 20261002100000_coupons.sql).
 */
export type DiscountType = "percent" | "amount";

export type Coupon = {
  code: string;
  discountType: DiscountType;
  /** Percent (1–100) or halalas. */
  discountValue: number;
  note: LocalizedText;
  expiresAt: string;
};

/** "ABCD2345" → "ABCD-2345": easier to read aloud and type. */
export const formatCode = (code: string) => `${code.slice(0, 4)}-${code.slice(4)}`;

/**
 * The discount alone: "15%" or "SAR 20" (Arabic: "20 ر.س"). Goes into a translated sentence, so a
 * percentage is wrapped in a left-to-right isolate: inside Arabic text it must still read "15%".
 */
export const discountAmount = (locale: Locale, type: DiscountType, value: number) =>
  type === "percent" ? `\u2066${formatPercent(locale, value / 100, 0)}\u2069` : formatSar(locale, value);
