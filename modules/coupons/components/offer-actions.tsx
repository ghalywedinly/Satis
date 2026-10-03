"use client";

import { useState, useTransition } from "react";
import { Pause, Play } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import type { CouponOfferStatus } from "@/types/database";
import { setOfferStatus } from "../actions";

/** Pause, resume or end a reward. Ended rewards can't be restarted; create a new one instead. */
export function OfferActions({ offerId, status }: { offerId: string; status: CouponOfferStatus }) {
  const t = useTranslations("coupons.offers");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ErrorKey | null>(null);
  if (status === "archived") return null;
  const toggle = () => startTransition(async () => setError(await setOfferStatus(locale, offerId, status === "active" ? "paused" : "active")));
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button variant="ghost" size="sm" disabled={pending} onClick={toggle}>
        {status === "active" ? <Pause aria-hidden strokeWidth={1.75} /> : <Play aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />}
        {status === "active" ? t("pause") : t("resume")}
      </Button>
      <ConfirmAction
        trigger={
          <Button variant="ghost" size="sm">
            {t("end")}
          </Button>
        }
        title={t("end")}
        description={t("endConfirm")}
        confirmLabel={t("end")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={() => setOfferStatus(locale, offerId, "archived")}
      />
      {error && (
        <p role="alert" className="w-full text-sm text-ember-700">
          {te(error)}
        </p>
      )}
    </div>
  );
}
