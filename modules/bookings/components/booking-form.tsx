"use client";

import { useActionState, useId, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { idle, type FormState } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { saveBooking, type BookingField } from "../actions";
import { BOOKING_STATUSES, whatsappLink, type Booking } from "../definition";

/** Status, meeting link and notes for one booking, saved together. */
export function BookingForm({ booking, when }: { booking: Booking; when: string }) {
  const t = useTranslations("admin");
  const tv = useTranslations("validation");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [state, action] = useActionState<FormState<BookingField>, FormData>(saveBooking.bind(null, locale, booking.id), idle);
  const [status, setStatus] = useState(booking.status);
  const [link, setLink] = useState(booking.meeting_link ?? "");
  const notesId = useId();
  const validLink = /^https:\/\/\S+$/.test(link.trim());

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      {state.status === "success" && <FormAlert tone="success">{t("details.saved")}</FormAlert>}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">{t("details.status")}</legend>
        <input type="hidden" name="status" value={status} />
        <div role="radiogroup" aria-label={t("details.status")} className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {BOOKING_STATUSES.map((value) => {
            const selected = status === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setStatus(value)}
                className={cn(
                  "h-10 rounded-control border px-3 text-sm font-semibold outline-none transition-colors duration-[140ms] focus-visible:shadow-focus",
                  selected
                    ? value === "cancelled"
                      ? "border-ember-600 bg-ember-50 text-ember-700"
                      : "border-ultramarine bg-ultra-50 text-ultramarine"
                    : value === "cancelled"
                      ? "border-border bg-white text-ember-700 hover:bg-ember-50"
                      : "border-border bg-white hover:bg-sand-100",
                )}
              >
                {t(`statuses.${value}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <FormField
          label={t("details.meetingLink")}
          name="meetingLink"
          type="url"
          dir="ltr"
          inputMode="url"
          placeholder="https://meet.google.com/…"
          hint={t("details.meetingLinkHint")}
          value={link}
          onChange={(e) => setLink(e.target.value)}
          error={state.fieldErrors?.meetingLink}
          className="h-11"
        />
        {validLink && (
          <Button asChild variant="outline" className="self-start">
            <a href={whatsappLink(booking.phone, t("details.whatsappLink", { name: booking.full_name.split(/\s+/)[0], when, link: link.trim() }))} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden strokeWidth={1.75} />
              {t("details.sendLink")}
            </a>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={notesId}>{t("details.notes")}</Label>
        <textarea
          id={notesId}
          name="notes"
          rows={4}
          maxLength={2000}
          defaultValue={state.values?.notes ?? booking.notes ?? ""}
          aria-describedby={`${notesId}-hint`}
          className="w-full resize-y rounded-control border border-input bg-white px-3 py-2.5 text-base outline-none transition-[border-color,box-shadow] duration-[140ms] focus-visible:border-ultramarine focus-visible:shadow-focus md:text-sm"
        />
        <p id={`${notesId}-hint`} className={cn("text-xs", state.fieldErrors?.notes ? "font-medium text-ember-700" : "text-muted-foreground")}>
          {state.fieldErrors?.notes ? tv(state.fieldErrors.notes) : t("details.notesHint")}
        </p>
      </div>

      <SubmitButton className="self-start">{t("details.save")}</SubmitButton>
    </form>
  );
}
