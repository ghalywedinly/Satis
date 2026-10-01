import type { Locale } from "./routing";

/**
 * Intl locale tags. Western digits (nu-latn) and the Gregorian calendar (ca-gregory) in both
 * languages: "ar-SA" alone would give Arabic-Indic digits and the Hijri (Umm al-Qura) calendar.
 * Either can become an organization setting later.
 */
export const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-SA-u-ca-gregory");

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}

/** Percent with no space ("92.4%"), as the brand rules require, in both languages. */
export function formatPercent(locale: Locale, ratio: number, maximumFractionDigits = 1) {
  return `${formatNumber(locale, ratio * 100, { maximumFractionDigits })}%`;
}

/**
 * Saudi Riyal amounts are stored in halalas (integer minor units).
 * Arabic shows "ر.س" after the amount, English shows "SAR" before it.
 */
export function formatSar(locale: Locale, halalas: number) {
  const amount = formatNumber(locale, halalas / 100, {
    minimumFractionDigits: halalas % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return locale === "ar" ? `${amount} ر.س` : `SAR ${amount}`;
}

/** Businesses are in Saudi Arabia; organizations may get their own time zone later. */
export const APP_TIME_ZONE = "Asia/Riyadh";

/** Dates in the product's numbering convention (Western digits), Gregorian calendar, Saudi time. */
export function formatDate(locale: Locale, date: Date | string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: APP_TIME_ZONE, ...options }).format(typeof date === "string" ? new Date(date) : date);
}

/** Integers for use inside translated messages. Pass the result as a string so ICU doesn't reformat it. */
export const formatCount = (locale: Locale, value: number) => formatNumber(locale, value, { maximumFractionDigits: 0 });
