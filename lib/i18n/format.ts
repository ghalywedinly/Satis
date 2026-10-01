import type { Locale } from "./routing";

/**
 * Intl locale tags. Arabic uses Western digits (0-9) by default, which is common in
 * Saudi software; switch to "ar-SA" to get Arabic-Indic digits if that becomes a setting.
 */
export const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA");

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
