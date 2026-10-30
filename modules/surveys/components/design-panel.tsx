"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ACCENTS, BACKGROUNDS, RATING_STYLES, THEME_PRESETS, type SurveyTheme, type ThemePreset } from "../definition";
import { RatingScale } from "./rating-scale";
import { accentStyle, surfaceStyle } from "./survey-theme";

const SWATCH: Record<SurveyTheme["accent"], string> = {
  ultramarine: "bg-ultramarine",
  ember: "bg-ember",
  mint: "bg-mint-600",
  grape: "bg-grape-500",
  ink: "bg-ink",
};

const sameTheme = (a: SurveyTheme, b: SurveyTheme) => a.accent === b.accent && a.background === b.background && a.ratingStyle === b.ratingStyle;

/** Survey design: ready-made looks, then colour, background and rating style one by one. */
export function DesignPanel({ theme, disabled, onChange }: { theme: SurveyTheme; disabled: boolean; onChange: (theme: SurveyTheme) => void }) {
  const t = useTranslations("surveys.builder.design");

  const option = (selected: boolean) =>
    cn(
      "relative flex cursor-pointer flex-col items-center gap-2 rounded-tile border p-2.5 text-xs font-semibold outline-none transition-colors duration-[140ms] focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-60",
      selected ? "border-ink bg-white ring-1 ring-ink" : "border-border bg-white/70 hover:bg-white",
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("title")}</h2>
        </CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm font-medium">{t("presets")}</legend>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((key) => {
              const preset = THEME_PRESETS[key];
              const surface = surfaceStyle(preset);
              const selected = sameTheme(theme, preset);
              return (
                <button key={key} type="button" aria-pressed={selected} disabled={disabled} onClick={() => onChange(preset)} className={option(selected)}>
                  <span aria-hidden className={cn("flex h-16 w-full flex-col justify-end gap-1.5 overflow-hidden rounded-[8px] p-2", surface.page)}>
                    <span className={cn("rounded-[4px] p-1.5", surface.card(surface.heroDark))}>
                      <RatingScale value={4} ratingStyle={preset.ratingStyle} accent={preset.accent} dark={surface.heroDark} label="" size="sm" />
                    </span>
                    <span className={cn("h-2 rounded-full", accentStyle(preset.accent, surface.darkPage).bar)} />
                  </span>
                  {t(`preset.${key}`)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2.5 text-sm font-medium">{t("accent")}</legend>
          <div role="radiogroup" aria-label={t("accent")} className="flex flex-wrap gap-3">
            {ACCENTS.map((accent) => {
              const selected = theme.accent === accent;
              return (
                <button
                  key={accent}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={t(`accents.${accent}`)}
                  title={t(`accents.${accent}`)}
                  disabled={disabled}
                  onClick={() => onChange({ ...theme, accent })}
                  className={cn(
                    "flex size-10 cursor-pointer items-center justify-center rounded-full outline-none ring-offset-2 transition-shadow duration-[140ms] focus-visible:shadow-focus disabled:cursor-not-allowed",
                    SWATCH[accent],
                    selected && "ring-2 ring-ink",
                  )}
                >
                  {selected && <Check aria-hidden strokeWidth={2.5} className={cn("size-4", accent === "ember" ? "text-ink" : "text-white")} />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2.5 text-sm font-medium">{t("background")}</legend>
          <div role="radiogroup" aria-label={t("background")} className="grid grid-cols-4 gap-2.5">
            {BACKGROUNDS.map((background) => {
              const selected = theme.background === background;
              return (
                <button
                  key={background}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onChange({ ...theme, background })}
                  className={option(selected)}
                >
                  <span aria-hidden className={cn("h-9 w-full rounded-[6px] border border-ink-100", surfaceStyle({ ...theme, background }).page)} />
                  {t(`backgrounds.${background}`)}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2.5 text-sm font-medium">{t("ratingStyle")}</legend>
          <div role="radiogroup" aria-label={t("ratingStyle")} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {RATING_STYLES.map((ratingStyle) => {
              const selected = theme.ratingStyle === ratingStyle;
              return (
                <button
                  key={ratingStyle}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onChange({ ...theme, ratingStyle })}
                  className={cn(option(selected), "gap-3 py-3.5")}
                >
                  <span aria-hidden className="pointer-events-none w-full px-1">
                    <RatingScale value={4} ratingStyle={ratingStyle} accent={theme.accent} dark={false} label="" size="md" />
                  </span>
                  {t(`ratingStyles.${ratingStyle}`)}
                </button>
              );
            })}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
