"use client";

import { useActionState, useState } from "react";
import { ArrowRight, CalendarCheck2, CalendarPlus, Check, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SliceHighlight } from "@/components/brand/slice";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { idle, type FormState } from "@/lib/forms";
import { formatCount, formatDate } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { bookMeeting } from "../actions";
import type { BookingField } from "../schemas";
import { googleCalendarUrl, MEETING_MINUTES, riyadhDate, type BookingDay } from "../slots";

/** A calendar day, "YYYY-MM-DD", as a moment inside that day in Saudi time (for formatting). */
const noonOf = (date: string) => new Date(`${date}T09:00:00Z`);
const nextDate = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/**
 * Two steps: pick a day and time, then leave your details. A time someone else books in the
 * meantime is marked taken and the visitor is sent back to choose again, keeping what they typed.
 */
export function BookingWidget({ days, taken, today }: { days: BookingDay[]; taken: string[]; today: string }) {
  const t = useTranslations("booking");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [takenSlots, setTakenSlots] = useState(() => new Set(taken));
  const openIn = (day: BookingDay) => day.slots.filter((slot) => !takenSlots.has(slot)).length;
  const [day, setDay] = useState(() => days.find((d) => openIn(d) > 0)?.date ?? null);
  const [slot, setSlot] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const [state, formAction] = useActionState(async (prev: FormState<BookingField>, formData: FormData) => {
    const result = await bookMeeting(locale, prev, formData);
    if (result.formError === "slotTaken") {
      const lost = formData.get("startsAt");
      if (typeof lost === "string") setTakenSlots((current) => new Set(current).add(lost));
      setSlot(null);
      setStep(1);
    }
    return result;
  }, idle);

  if (state.status === "success" && state.values?.startsAt) return <Booked values={state.values} />;

  const selectedDay = days.find((d) => d.date === day);
  const time = (iso: string) => formatDate(locale, iso, { hour: "numeric", minute: "2-digit" });
  const dayName = (date: string, style: "short" | "long") =>
    date === today ? t("today") : date === nextDate(today) ? t("tomorrow") : formatDate(locale, noonOf(date), { weekday: style });
  const when = (iso: string) =>
    t("when", { day: `${dayName(riyadhDate(new Date(iso)), "long")} ${formatDate(locale, iso, { day: "numeric", month: "long" })}`, time: time(iso) });

  return (
    <div className="w-full max-w-[640px] rounded-card border border-border bg-white p-5 sm:p-8">
      <Steps step={step} />

      {step === 1 ? (
        <div key="time" className="mt-7 flex flex-col gap-7 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {state.formError === "slotTaken" && !slot && <FormAlert tone="error">{te("slotTaken")}</FormAlert>}

          {days.every((d) => openIn(d) === 0) ? (
            <div className="flex flex-col items-start gap-3 rounded-[16px] bg-sand-100 p-6">
              <CalendarCheck2 aria-hidden strokeWidth={1.75} className="size-6 text-ink-400" />
              <p className="font-display text-xl font-bold">{t("empty.title")}</p>
              <p className="text-muted-foreground">{t("empty.body")}</p>
            </div>
          ) : (
            <>
              <fieldset className="flex min-w-0 flex-col gap-3">
                <legend className="mb-3 text-sm font-semibold">{t("day")}</legend>
                {/* Scrolls sideways on phones; wraps into rows on wider screens. */}
                <div role="radiogroup" aria-label={t("day")} className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
                  {days.map((d, i) => {
                    const open = openIn(d);
                    const selected = d.date === day;
                    return (
                      <button
                        key={d.date}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={open === 0}
                        onClick={() => {
                          setDay(d.date);
                          setSlot(null);
                        }}
                        style={{ animationDelay: `${i * 30}ms` }}
                        className={cn(
                          "flex w-[84px] shrink-0 snap-start flex-col items-start gap-1 rounded-control border px-3 py-2.5 text-start outline-none sm:w-auto",
                          "animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-200",
                          "transition-[background-color,border-color,color] duration-[140ms] ease-[var(--ease-standard)] focus-visible:shadow-focus active:translate-y-px",
                          selected ? "border-ink bg-ink text-sand" : "border-border bg-white hover:border-ink-300",
                          open === 0 && "cursor-not-allowed opacity-45",
                        )}
                      >
                        <span className={cn("text-xs font-semibold", selected ? "text-ink-200" : "text-muted-foreground")}>{dayName(d.date, "short")}</span>
                        <span className="font-display text-2xl leading-none font-extrabold tracking-[-0.03em]">
                          {formatDate(locale, noonOf(d.date), { day: "numeric" })}
                        </span>
                        <span className={cn("text-[11px]", selected ? "text-ink-200" : "text-muted-foreground")}>
                          {open === 0 ? t("full") : formatDate(locale, noonOf(d.date), { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {selectedDay && (
                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-3 flex w-full items-center justify-between gap-3 text-sm font-semibold">
                    {t("time")}
                    <span className="text-xs font-normal text-muted-foreground">{t("open", { count: formatCount(locale, openIn(selectedDay)) })}</span>
                  </legend>
                  <div key={selectedDay.date} role="radiogroup" aria-label={t("time")} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {selectedDay.slots.map((s, i) => {
                      const isTaken = takenSlots.has(s);
                      const selected = s === slot;
                      return (
                        <button
                          key={s}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={isTaken}
                          aria-label={isTaken ? `${time(s)}, ${t("taken")}` : time(s)}
                          onClick={() => setSlot(s)}
                          style={{ animationDelay: `${i * 20}ms` }}
                          className={cn(
                            "h-11 rounded-control border text-sm font-semibold tabular-nums outline-none",
                            "animate-in fade-in fill-mode-both duration-200",
                            "transition-[background-color,border-color,color] duration-[140ms] ease-[var(--ease-standard)] focus-visible:shadow-focus active:translate-y-px",
                            selected
                              ? "border-ultramarine bg-ultramarine text-white"
                              : isTaken
                                ? "cursor-not-allowed border-transparent bg-sand-100 text-ink-300 line-through"
                                : "border-border bg-white hover:border-ultramarine hover:text-ultramarine",
                          )}
                        >
                          {time(s)}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">{slot ? when(slot) : t("pickHint")}</p>
                <Button type="button" size="lg" disabled={!slot} onClick={() => setStep(2)} className="h-12 px-6">
                  {t("continue")}
                  <ArrowRight aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <form key="details" action={formAction} noValidate className="mt-7 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-4 rounded-[16px] bg-sand-100 p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-ultramarine">
              <CalendarCheck2 aria-hidden strokeWidth={1.75} className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">{t("yourMeeting")}</span>
              <span className="font-semibold">{slot && when(slot)}</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)} className="text-ultramarine hover:text-ultramarine">
              {t("change")}
            </Button>
          </div>

          {state.formError && state.formError !== "slotTaken" && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
          <input type="hidden" name="startsAt" value={slot ?? ""} />
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label={t("fields.fullName")}
              name="fullName"
              autoComplete="name"
              required
              maxLength={120}
              defaultValue={state.values?.fullName}
              error={state.fieldErrors?.fullName}
              className="h-11"
            />
            <FormField
              label={t("fields.company")}
              name="company"
              autoComplete="organization"
              required
              maxLength={120}
              hint={t("fields.companyHint")}
              defaultValue={state.values?.company}
              error={state.fieldErrors?.company}
              className="h-11"
            />
            <FormField
              label={t("fields.email")}
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              required
              defaultValue={state.values?.email}
              error={state.fieldErrors?.email}
              className="h-11"
            />
            <FormField
              label={t("fields.phone")}
              name="phone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
              required
              maxLength={40}
              hint={t("fields.phoneHint")}
              defaultValue={state.values?.phone}
              error={state.fieldErrors?.phone}
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6">
            <SubmitButton className="h-12 w-full text-base">{t("submit")}</SubmitButton>
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock aria-hidden strokeWidth={1.75} className="size-3.5" />
              {t("privacy")}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 }) {
  const t = useTranslations("booking.steps");
  const locale = useLocale() as Locale;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em]">{step === 1 ? t("time") : t("details")}</h2>
        <span className="text-xs font-semibold text-muted-foreground">{t("of", { current: formatCount(locale, step), total: formatCount(locale, 2) })}</span>
      </div>
      <div aria-hidden className="flex gap-1.5">
        {[1, 2].map((n) => (
          <span
            key={n}
            className={cn("slice-sm h-1.5 flex-1 transition-colors duration-[320ms] ease-[var(--ease-standard)]", n <= step ? "bg-ultramarine" : "bg-ink-100")}
          />
        ))}
      </div>
    </div>
  );
}

/** Confirmation, with the time on the page's one Zest plate. */
function Booked({ values }: { values: NonNullable<FormState<BookingField>["values"]> }) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const startsAt = values.startsAt ?? "";
  const minutes = formatCount(locale, MEETING_MINUTES);
  const firstName = (values.fullName ?? "").trim().split(/\s+/)[0] ?? "";
  const date = formatDate(locale, startsAt, { weekday: "long", day: "numeric", month: "long" });
  const time = formatDate(locale, startsAt, { hour: "numeric", minute: "2-digit" });

  return (
    <div role="status" className="flex w-full max-w-[640px] flex-col items-start gap-6 rounded-card border border-border bg-white p-6 sm:p-10">
      <span className="flex size-14 items-center justify-center rounded-full bg-mint-50 text-mint-600 animate-in zoom-in-50 fade-in duration-300 ease-[var(--ease-pop)]">
        <Check aria-hidden strokeWidth={2.5} className="size-7" />
      </span>
      <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 [animation-delay:80ms]">
        <span className="eyebrow">{t("success.eyebrow")}</span>
        <h2 className="font-display text-[clamp(28px,3.4vw,40px)] leading-[1.08] font-extrabold tracking-[-0.035em]">{t("success.title", { name: firstName })}</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-semibold">
          <SliceHighlight tone="zest" className="px-3 py-0.5">
            {date}
          </SliceHighlight>
          <span className="tabular-nums">{time}</span>
        </p>
        <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
          {t.rich("success.body", { email: () => <bdi dir="ltr" className="font-semibold text-ink">{values.email}</bdi> })}
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 border-t border-border pt-6 sm:flex-row">
        <Button asChild size="lg" className="h-12 px-6">
          <a href={googleCalendarUrl(startsAt, t("success.calendarTitle"), t("success.calendarDetails", { minutes }))} target="_blank" rel="noopener noreferrer">
            <CalendarPlus aria-hidden strokeWidth={1.75} />
            {t("success.addToCalendar")}
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 px-6">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
