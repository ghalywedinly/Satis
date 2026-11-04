/**
 * The themes AI can tag a comment with. A fixed list, so mentions can be counted across
 * businesses and periods and shown in both languages (locales/{ar,en}/ai.json → themes).
 * Changing it is a product decision: add keys, don't rename them.
 */
export const THEMES = [
  "staff",
  "speed",
  "cleanliness",
  "quality",
  "price",
  "atmosphere",
  "facilities",
  "booking",
  "parking",
  "other",
] as const;

export type Theme = (typeof THEMES)[number];

export const isTheme = (value: string): value is Theme => (THEMES as readonly string[]).includes(value);

export const SENTIMENTS = ["positive", "neutral", "negative", "mixed"] as const;
export type AiSentiment = (typeof SENTIMENTS)[number];
