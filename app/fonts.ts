import localFont from "next/font/local";

/*
 * Brand fonts, self-hosted (variable woff2 from Fontsource, SIL OFL: assets/fonts/LICENSES.txt)
 * so builds never depend on reaching Google Fonts.
 */
export const bricolage = localFont({
  src: "../assets/fonts/bricolage-grotesque-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-bricolage",
  display: "swap",
});
export const instrument = localFont({
  src: "../assets/fonts/instrument-sans-latin-wght-normal.woff2",
  weight: "400 700",
  variable: "--font-instrument",
  display: "swap",
});
// Readex Pro ships as two subset files; the stack lists Arabic first and Latin as its fallback.
export const readexArabic = localFont({
  src: "../assets/fonts/readex-pro-arabic-wght-normal.woff2",
  weight: "160 700",
  variable: "--font-readex-arabic",
  display: "swap",
  // No metric-matched Arial fallback here: it would catch Latin glyphs before Readex Latin does.
  adjustFontFallback: false,
});
export const readex = localFont({
  src: "../assets/fonts/readex-pro-latin-wght-normal.woff2",
  weight: "160 700",
  variable: "--font-readex",
  display: "swap",
});
export const jetbrains = localFont({
  src: "../assets/fonts/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "swap",
});

export const fontVariables = [bricolage.variable, instrument.variable, readexArabic.variable, readex.variable, jetbrains.variable].join(" ");
