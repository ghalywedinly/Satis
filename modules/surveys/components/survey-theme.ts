import type { SurveyTheme } from "../definition";

/*
 * Class names for each survey design choice. Written out in full (not built from strings) so
 * Tailwind can see them. Text on Ember is always Ink, as the brand requires.
 */

type AccentStyle = {
  /** Filled button or selected tile. */
  solid: string;
  /** Selected choice row. */
  soft: string;
  border: string;
  /** Rating slice or bar fill. */
  bar: string;
  /** Icon colour for filled hearts. */
  icon: string;
  /** Tinted page ground. */
  tint: string;
  link: string;
};

const LIGHT: Record<SurveyTheme["accent"], AccentStyle> = {
  ultramarine: {
    solid: "bg-ultramarine text-white hover:bg-ultra-600",
    soft: "bg-ultra-50",
    border: "border-ultramarine",
    bar: "bg-ultramarine",
    icon: "fill-ultramarine text-ultramarine",
    tint: "bg-ultra-50",
    link: "text-ultramarine",
  },
  ember: {
    solid: "bg-ember text-ink hover:bg-ember-600",
    soft: "bg-ember-50",
    border: "border-ember-600",
    bar: "bg-ember",
    icon: "fill-ember text-ember-600",
    tint: "bg-ember-50",
    link: "text-ember-700",
  },
  mint: {
    solid: "bg-mint-600 text-white hover:bg-mint-700",
    soft: "bg-mint-50",
    border: "border-mint-600",
    bar: "bg-mint-600",
    icon: "fill-mint-600 text-mint-600",
    tint: "bg-mint-50",
    link: "text-mint-700",
  },
  grape: {
    solid: "bg-grape-500 text-white hover:bg-grape-600",
    soft: "bg-grape-50",
    border: "border-grape-500",
    bar: "bg-grape-500",
    icon: "fill-grape-500 text-grape-500",
    tint: "bg-grape-50",
    link: "text-grape-600",
  },
  ink: {
    solid: "bg-ink text-sand hover:bg-ink-700",
    soft: "bg-ink-50",
    border: "border-ink",
    bar: "bg-ink",
    icon: "fill-ink text-ink",
    tint: "bg-sand-100",
    link: "text-ink",
  },
};

/** On dark cards an Ink accent would disappear, so it turns to Sand there. */
const INK_ON_DARK: AccentStyle = {
  solid: "bg-sand text-ink hover:bg-sand-200",
  soft: "bg-white/10",
  border: "border-sand",
  bar: "bg-sand",
  icon: "fill-sand text-sand",
  tint: "bg-ink",
  link: "text-sand",
};

export function accentStyle(accent: SurveyTheme["accent"], dark: boolean): AccentStyle {
  if (dark && accent === "ink") return INK_ON_DARK;
  const style = LIGHT[accent];
  return dark ? { ...style, soft: "bg-white/10" } : style;
}

/** The page, its question cards, and which cards are dark. */
export function surfaceStyle(theme: SurveyTheme) {
  const darkPage = theme.background === "ink";
  return {
    darkPage,
    page: {
      sand: "bg-sand text-ink",
      white: "bg-white text-ink",
      ink: "bg-ink text-sand",
      tint: `${LIGHT[theme.accent].tint} text-ink`,
    }[theme.background],
    /** The first question stands out: dark on Sand (the brand look), otherwise like the rest. */
    heroDark: theme.background === "sand" || darkPage,
    card: (dark: boolean) => (dark ? (darkPage ? "border-ink-700 bg-ink-800 text-sand" : "border-ink bg-ink text-sand") : "border-border bg-white text-ink"),
    muted: (dark: boolean) => (dark ? "text-ink-300" : "text-muted-foreground"),
  };
}
