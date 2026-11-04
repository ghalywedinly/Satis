"use client";

import { useState, useTransition } from "react";
import { BellRing, CalendarDays, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { saveNotificationPreferences } from "../actions";

type Preferences = { negativeAlerts: boolean; weeklyReport: boolean };

/** Two on/off switches for the member's own emails, saved together. */
export function NotificationPreferencesForm({ initial }: { initial: Preferences }) {
  const t = useTranslations("notifications");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const row = (key: keyof Preferences, Icon: LucideIcon, chip: string) => (
    <label className="flex cursor-pointer items-start gap-4 rounded-tile border border-border bg-white/70 p-4 transition-colors duration-[140ms] hover:bg-white">
      <span aria-hidden className={cn("slice-sm flex h-9 w-11 shrink-0 items-center justify-center", chip)}>
        <Icon strokeWidth={1.75} className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-semibold">{t(`${key}.label`)}</span>
        <span className="text-sm text-muted-foreground">{t(`${key}.hint`)}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={values[key]}
        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.checked }))}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-ink-200 transition-colors duration-[140ms] peer-checked:bg-ultramarine peer-focus-visible:shadow-focus after:absolute after:top-0.5 after:start-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform after:duration-[140ms] peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5"
      />
    </label>
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const error = await saveNotificationPreferences(locale, values);
          setMessage(error ? { tone: "error", text: te(error as ErrorKey) } : { tone: "success", text: t("saved") });
        });
      }}
    >
      {row("negativeAlerts", BellRing, "bg-ember-50 text-ember-700")}
      {row("weeklyReport", CalendarDays, "bg-ultra-50 text-ultramarine")}
      {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
      <Button type="submit" className="self-start" disabled={pending}>
        {t("save")}
      </Button>
    </form>
  );
}
