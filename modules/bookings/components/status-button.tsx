"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { setBookingStatus } from "../actions";
import type { BookingStatus } from "../definition";

/** One tap to move a booking on, e.g. "Confirm" in the "Needs your reply" list. */
export function StatusButton({ bookingId, status, label, className }: { bookingId: string; status: BookingStatus; label: string; className?: string }) {
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(async () => setError(await setBookingStatus(locale, bookingId, status)))}
        className={cn("bg-ink text-sand hover:bg-ink-700", className)}
      >
        {pending && <Loader2 aria-hidden strokeWidth={1.75} className="animate-spin" />}
        {label}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-ember-700">
          {te(error)}
        </span>
      )}
    </span>
  );
}
