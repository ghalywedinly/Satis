"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  BedDouble,
  ChevronLeft,
  Coffee,
  Dumbbell,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Store,
  Ticket,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { idle } from "@/lib/forms";
import { formatCount } from "@/lib/i18n/format";
import { trackClient } from "@/lib/observability/client";
import { cn } from "@/lib/utils";
import type { BusinessType } from "@/types/database";
import { createOrganization, type CreateOrganizationField } from "../actions";
import { BUSINESS_TYPES } from "../schemas";

const ICONS: Record<BusinessType, LucideIcon> = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  retail: ShoppingBag,
  clinic: Stethoscope,
  beauty: Sparkles,
  hotel: BedDouble,
  gym: Dumbbell,
  entertainment: Ticket,
  other: Store,
};

const STEPS = ["welcome", "name", "type", "location"] as const;
const FIELD_STEP: Record<CreateOrganizationField, number> = { name: 1, businessType: 2, locationName: 3, locationCity: 3 };

/** Onboarding steps 1–4 (spec §11): welcome, business name, business type, first location. */
export function OnboardingWizard({ skipWelcome }: { skipWelcome: boolean }) {
  const t = useTranslations("onboarding");
  const tt = useTranslations("organization.businessTypes");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [state, action] = useActionState(createOrganization.bind(null, locale), idle);
  const [step, setStep] = useState(skipWelcome ? 1 : 0);
  const [name, setName] = useState("");
  const [type, setType] = useState<BusinessType | "">("");
  const [touched, setTouched] = useState(false);
  const headings = useRef<(HTMLHeadingElement | null)[]>([]);

  useEffect(() => trackClient("onboarding_started"), []);

  // After a failed submit, go back to the first step with an error (adjusted during render, not in an effect).
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    const fields = Object.keys(state.fieldErrors ?? {}) as CreateOrganizationField[];
    if (fields.length > 0) setStep(Math.min(...fields.map((f) => FIELD_STEP[f])));
  }

  // Move focus to the new step's heading so screen readers announce it.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headings.current[step]?.focus();
  }, [step]);

  const stepValid = step === 1 ? name.trim().length > 0 : step === 2 ? type !== "" : true;
  const next = () => {
    setTouched(true);
    if (!stepValid) return;
    setTouched(false);
    setStep((s) => s + 1);
  };
  const localError = touched && !stepValid ? "required" : undefined;
  const heading = (index: number, text: string) => (
    <h1
      ref={(el) => {
        headings.current[index] = el;
      }}
      tabIndex={-1}
      className="text-[32px] leading-tight font-extrabold outline-none sm:text-4xl"
    >
      {text}
    </h1>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">{t("progress", { current: formatCount(locale, step + 1), total: formatCount(locale, STEPS.length) })}</p>
        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "slice-sm h-2 flex-1 transition-colors duration-[320ms] ease-[var(--ease-standard)]",
                i <= step ? "bg-ultramarine" : "bg-ink-100",
              )}
            />
          ))}
        </div>
      </div>

      <form action={action} noValidate className="flex flex-col gap-8">
        {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}

        <section hidden={step !== 0} className="flex flex-col gap-4">
          {heading(0, t("welcome.title"))}
          <p className="text-lg text-muted-foreground">{t("welcome.body")}</p>
          <Button type="button" size="lg" className="self-start" onClick={() => setStep(1)}>
            {t("welcome.start")}
          </Button>
        </section>

        <section hidden={step !== 1} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {heading(1, t("name.title"))}
            <p className="text-muted-foreground">{t("name.hint")}</p>
          </div>
          <FormField
            label={t("name.label")}
            name="name"
            autoComplete="organization"
            placeholder={t("name.placeholder")}
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                next();
              }
            }}
            error={step === 1 ? (localError ?? state.fieldErrors?.name) : undefined}
          />
        </section>

        <section hidden={step !== 2} className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-6">
            <legend className="mb-6 flex flex-col gap-2">
              {heading(2, t("type.title"))}
              <span className="text-muted-foreground">{t("type.hint")}</span>
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BUSINESS_TYPES.map((value) => {
                const Icon = ICONS[value];
                return (
                  <label
                    key={value}
                    className="flex cursor-pointer flex-col items-start gap-3 rounded-tile border border-border bg-white p-4 transition-colors duration-[140ms] ease-[var(--ease-standard)] hover:border-ink-300 has-[:checked]:border-ultramarine has-[:checked]:bg-ultra-50 has-[:focus-visible]:shadow-focus"
                  >
                    <input
                      type="radio"
                      name="businessType"
                      value={value}
                      checked={type === value}
                      onChange={() => setType(value)}
                      className="sr-only"
                    />
                    <Icon aria-hidden strokeWidth={1.75} className="size-6 text-ink" />
                    <span className="text-sm font-semibold">{tt(value)}</span>
                  </label>
                );
              })}
            </div>
            {step === 2 && (localError ?? state.fieldErrors?.businessType) && (
              <p role="alert" className="text-xs font-medium text-ember-700">
                {t("type.required")}
              </p>
            )}
          </fieldset>
        </section>

        <section hidden={step !== 3} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {heading(3, t("location.title"))}
            <p className="text-muted-foreground">{t("location.hint")}</p>
          </div>
          <FormField
            label={t("location.nameLabel")}
            name="locationName"
            placeholder={t("location.namePlaceholder")}
            maxLength={120}
            required
            defaultValue={state.values?.locationName}
            error={state.fieldErrors?.locationName}
          />
          <FormField
            label={t("location.cityLabel")}
            name="locationCity"
            autoComplete="address-level2"
            placeholder={t("location.cityPlaceholder")}
            maxLength={80}
            defaultValue={state.values?.locationCity}
            error={state.fieldErrors?.locationCity}
          />
        </section>

        {step > 0 && (
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={skipWelcome && step === 1}
              className={cn(skipWelcome && step === 1 && "invisible")}
            >
              <ChevronLeft aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
              {t("back")}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" size="lg" onClick={next}>
                {t("next")}
              </Button>
            ) : (
              <SubmitButton>{t("location.submit")}</SubmitButton>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
