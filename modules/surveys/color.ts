import type { SurveyFont, SurveyTheme } from "./definition";

/*
 * Custom survey colours and fonts. A business can pick any colour for its survey, so text
 * colours are chosen from it automatically to stay readable (WCAG contrast), and everything is
 * passed to the page as CSS variables (see accentStyle/surfaceStyle).
 */

const INK = "#0B0D12";
const SAND = "#FAF8F4";
const WHITE = "#FFFFFF";

export const isHex = (value: string | undefined): value is string => !!value && /^#[0-9a-f]{6}$/i.test(value);

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance (WCAG 2). */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Ink or white, whichever reads better on the colour. */
export const textOn = (hex: string) => (contrast(hex, INK) >= contrast(hex, WHITE) ? INK : WHITE);

/** A colour mixed towards another by `amount` (0–1). */
export function mix(hex: string, toward: string, amount: number): string {
  const a = rgb(hex);
  const b = rgb(toward);
  return `#${a.map((c, i) => Math.round(c + (b[i] - c) * amount).toString(16).padStart(2, "0")).join("")}`;
}

/** A dark page ground: cards and text switch to their dark versions on it. */
export const isDarkColor = (hex: string) => luminance(hex) < 0.18;

/** Font stacks for each survey font. "satis" keeps the brand fonts (no override). */
export const FONT_STACKS: Record<Exclude<SurveyFont, "satis">, string> = {
  cairo: '"Satis Cairo", system-ui, sans-serif',
  tajawal: '"Satis Tajawal", system-ui, sans-serif',
  plex: '"Satis Plex Arabic", system-ui, sans-serif',
  almarai: '"Satis Almarai", system-ui, sans-serif',
  kufi: '"Satis Noto Kufi", system-ui, sans-serif',
  naskh: '"Satis Noto Naskh", serif',
};

/**
 * CSS variables for a survey's custom colours and font, set on the survey's outer element.
 * Brand accents and grounds use classes instead, so this is empty for them.
 */
export function themeVars(theme: SurveyTheme): React.CSSProperties {
  const vars: Record<string, string> = {};
  if (theme.accent === "custom" && isHex(theme.accentColor)) {
    const accent = theme.accentColor;
    vars["--sv-accent"] = accent;
    vars["--sv-accent-fg"] = textOn(accent);
    vars["--sv-accent-hover"] = mix(accent, textOn(accent) === WHITE ? INK : WHITE, 0.12);
    vars["--sv-accent-soft"] = mix(accent, WHITE, 0.88);
    // Links and outlines need contrast against the page; fall back to Ink or Sand when too faint.
    vars["--sv-accent-on-light"] = contrast(accent, WHITE) >= 3 ? accent : INK;
    vars["--sv-accent-on-dark"] = contrast(accent, INK) >= 3 ? accent : SAND;
  }
  if (theme.background === "custom" && isHex(theme.backgroundColor)) {
    vars["--sv-page"] = theme.backgroundColor;
    vars["--sv-page-fg"] = isDarkColor(theme.backgroundColor) ? SAND : INK;
  }
  const font = theme.font ?? "satis";
  if (font !== "satis") {
    const stack = FONT_STACKS[font];
    // The app's font utilities and its Arabic rule all read these variables.
    vars["--font-display"] = stack;
    vars["--font-sans"] = stack;
    vars["--font-arabic"] = stack;
  }
  return vars as React.CSSProperties;
}
