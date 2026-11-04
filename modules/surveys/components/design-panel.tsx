"use client";

import { useId, useRef, useState } from "react";
import { Check, ImageUp, Loader2, Pipette, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isHex, textOn, themeVars } from "../color";
import {
  ACCENTS,
  BACKGROUNDS,
  LOGO_POSITIONS,
  LOGO_SIZES,
  RATING_STYLES,
  SURVEY_FONTS,
  THEME_PRESETS,
  type SurveyTheme,
  type ThemePreset,
} from "../definition";
import { prepareLogo, type LogoError } from "./logo-file";
import { RatingScale } from "./rating-scale";
import { SurveyLogoImage } from "./survey-logo";
import { accentStyle, surfaceStyle } from "./survey-theme";

const SWATCH: Record<(typeof ACCENTS)[number], string> = {
  ultramarine: "bg-ultramarine",
  ember: "bg-ember",
  mint: "bg-mint-600",
  grape: "bg-grape-500",
  ink: "bg-ink",
};

/** Starting points when someone first switches to a custom colour. */
const DEFAULT_CUSTOM_ACCENT = "#0F766E";
const DEFAULT_CUSTOM_BACKGROUND = "#FFF7ED";

const sameLook = (a: SurveyTheme, b: SurveyTheme) => a.accent === b.accent && a.background === b.background && a.ratingStyle === b.ratingStyle;

/**
 * Survey design: ready-made looks, then colour, background, font, logo and rating style.
 * Brand colours come first; a business can also use its own colours, font and logo.
 */
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
      <CardContent className="flex flex-col gap-7">
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm font-medium">{t("presets")}</legend>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((key) => {
              const preset: SurveyTheme = { ...THEME_PRESETS[key], font: theme.font, logo: theme.logo };
              const surface = surfaceStyle(preset);
              const selected = sameLook(theme, preset);
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
          <div role="radiogroup" aria-label={t("accent")} className="flex flex-wrap items-center gap-3">
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
            <CustomSwatch
              label={t("accents.custom")}
              selected={theme.accent === "custom"}
              color={theme.accentColor}
              disabled={disabled}
              onSelect={() => onChange({ ...theme, accent: "custom", accentColor: theme.accentColor ?? DEFAULT_CUSTOM_ACCENT })}
            />
          </div>
          {theme.accent === "custom" && (
            <ColorField
              label={t("customAccent")}
              value={theme.accentColor ?? DEFAULT_CUSTOM_ACCENT}
              disabled={disabled}
              onChange={(accentColor) => onChange({ ...theme, accentColor })}
            />
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2.5 text-sm font-medium">{t("background")}</legend>
          <div role="radiogroup" aria-label={t("background")} className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
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
            <button
              type="button"
              role="radio"
              aria-checked={theme.background === "custom"}
              disabled={disabled}
              onClick={() => onChange({ ...theme, background: "custom", backgroundColor: theme.backgroundColor ?? DEFAULT_CUSTOM_BACKGROUND })}
              className={option(theme.background === "custom")}
            >
              <span
                aria-hidden
                className="flex h-9 w-full items-center justify-center rounded-[6px] border border-ink-100"
                style={{ backgroundColor: theme.backgroundColor ?? DEFAULT_CUSTOM_BACKGROUND }}
              >
                <Pipette strokeWidth={1.75} className="size-4" style={{ color: textOn(theme.backgroundColor ?? DEFAULT_CUSTOM_BACKGROUND) }} />
              </span>
              {t("backgrounds.custom")}
            </button>
          </div>
          {theme.background === "custom" && (
            <ColorField
              label={t("customBackground")}
              value={theme.backgroundColor ?? DEFAULT_CUSTOM_BACKGROUND}
              disabled={disabled}
              onChange={(backgroundColor) => onChange({ ...theme, backgroundColor })}
            />
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2.5 text-sm font-medium">{t("font")}</legend>
          <div role="radiogroup" aria-label={t("font")} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {SURVEY_FONTS.map((font) => {
              const selected = (theme.font ?? "satis") === font;
              return (
                <button
                  key={font}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onChange({ ...theme, font })}
                  className={cn(option(selected), "items-stretch gap-1 px-3 py-3 text-start")}
                >
                  <span aria-hidden className="font-sans text-xl leading-tight font-bold" style={themeVars({ ...theme, accent: "ink", background: "white", font })}>
                    {t("fontSample")}
                  </span>
                  <span className="font-medium text-muted-foreground">{t(`fonts.${font}`)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <LogoField theme={theme} disabled={disabled} onChange={onChange} />

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
                  style={themeVars(theme)}
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

/** The swatch that switches to the business's own colour. */
function CustomSwatch({ label, selected, color, disabled, onSelect }: { label: string; selected: boolean; color?: string; disabled: boolean; onSelect: () => void }) {
  const fill = isHex(color) ? color : DEFAULT_CUSTOM_ACCENT;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-white ps-1 pe-3.5 text-xs font-semibold outline-none ring-offset-2 transition-shadow duration-[140ms] focus-visible:shadow-focus disabled:cursor-not-allowed",
        selected && "ring-2 ring-ink",
      )}
    >
      <span aria-hidden className="flex size-8 items-center justify-center rounded-full" style={{ backgroundColor: fill }}>
        {selected ? (
          <Check strokeWidth={2.5} className="size-4" style={{ color: textOn(fill) }} />
        ) : (
          <Pipette strokeWidth={1.75} className="size-4" style={{ color: textOn(fill) }} />
        )}
      </span>
      {label}
    </button>
  );
}

/** Colour picker plus a hex box, for people who know their brand colour by heart. */
function ColorField({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (hex: string) => void }) {
  const t = useTranslations("surveys.builder.design");
  const id = useId();
  const [text, setText] = useState(value);
  const [shown, setShown] = useState(value);
  // Follow outside changes (another preset, undo) without an effect.
  if (value !== shown) {
    setShown(value);
    setText(value);
  }
  return (
    <div className="mt-3 flex items-center gap-3">
      <input
        type="color"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-10 w-12 cursor-pointer rounded-control border border-input bg-white p-1 disabled:cursor-not-allowed"
      />
      <label htmlFor={id} className="sr-only">
        {`${label}: ${t("hexCode")}`}
      </label>
      <input
        id={id}
        dir="ltr"
        value={text}
        disabled={disabled}
        maxLength={7}
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value.trim();
          setText(next);
          const hex = next.startsWith("#") ? next : `#${next}`;
          if (isHex(hex)) onChange(hex.toUpperCase());
        }}
        className="h-10 w-28 rounded-control border border-input bg-white px-3 font-mono text-sm uppercase outline-none focus-visible:border-ultramarine focus-visible:shadow-focus"
      />
    </div>
  );
}

/** Upload, place and size the business's logo. */
function LogoField({ theme, disabled, onChange }: { theme: SurveyTheme; disabled: boolean; onChange: (theme: SurveyTheme) => void }) {
  const t = useTranslations("surveys.builder.design");
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LogoError | null>(null);
  const logo = theme.logo ?? null;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const result = await prepareLogo(file);
    setBusy(false);
    if (input.current) input.current.value = "";
    if ("error" in result) return setError(result.error);
    onChange({ ...theme, logo: { src: result.src, position: logo?.position ?? "center", size: logo?.size ?? "md" } });
  };

  const choice = (selected: boolean) =>
    cn(
      "h-9 flex-1 cursor-pointer rounded-control border px-3 text-xs font-semibold outline-none transition-colors duration-[140ms] focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-60",
      selected ? "border-ink bg-ink text-sand" : "border-border bg-white hover:bg-sand-100",
    );

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium">{t("logo")}</legend>
      <p className="text-xs text-muted-foreground">{t("logoHint")}</p>

      {logo && (
        <div className="rounded-tile border border-border bg-sand-50 p-4" style={themeVars(theme)}>
          <SurveyLogoImage logo={logo} alt={t("logoPreview")} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          aria-label={t("uploadLogo")}
          disabled={disabled || busy}
          onChange={(e) => upload(e.target.files?.[0])}
          className="sr-only"
        />
        <Button type="button" variant="outline" disabled={disabled || busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 aria-hidden strokeWidth={1.75} className="animate-spin" /> : <ImageUp aria-hidden strokeWidth={1.75} />}
          {logo ? t("replaceLogo") : t("uploadLogo")}
        </Button>
        {logo && (
          <Button type="button" variant="ghost" disabled={disabled} onClick={() => onChange({ ...theme, logo: null })}>
            <Trash2 aria-hidden strokeWidth={1.75} />
            {t("removeLogo")}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-ember-700">
          {t(`logoErrors.${error}`)}
        </p>
      )}

      {logo && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t("logoPosition")}</span>
            <div role="radiogroup" aria-label={t("logoPosition")} className="flex gap-1.5">
              {LOGO_POSITIONS.map((position) => (
                <button
                  key={position}
                  type="button"
                  role="radio"
                  aria-checked={logo.position === position}
                  disabled={disabled}
                  onClick={() => onChange({ ...theme, logo: { ...logo, position } })}
                  className={choice(logo.position === position)}
                >
                  {t(`logoPositions.${position}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t("logoSize")}</span>
            <div role="radiogroup" aria-label={t("logoSize")} className="flex gap-1.5">
              {LOGO_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={logo.size === size}
                  disabled={disabled}
                  onClick={() => onChange({ ...theme, logo: { ...logo, size } })}
                  className={choice(logo.size === size)}
                >
                  {t(`logoSizes.${size}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}
