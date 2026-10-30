"use client";

import { useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Clock, ScanLine } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { ErrorKey } from "@/lib/forms";
import { formatDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { textIn } from "@/modules/surveys/definition";
import { checkCoupon, redeemCoupon, type CouponCheck } from "../actions";
import { discountAmount, formatCode } from "../definition";

/** Staff check a customer's code and mark it used. */
export function RedeemPanel({ locations }: { locations: { id: string; name: string }[] }) {
  const t = useTranslations("coupons");
  const tErrors = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [code, setCode] = useState("");
  const [locationId, setLocationId] = useState(locations.length === 1 ? locations[0].id : "");
  const [result, setResult] = useState<CouponCheck | null>(null);
  const [justRedeemed, setJustRedeemed] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setCode("");
    setResult(null);
    setJustRedeemed(false);
    setError(null);
  };

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      setJustRedeemed(false);
      const r = await checkCoupon(locale, code);
      if ("error" in r) {
        setError(r.error);
        setResult(null);
      } else {
        setError(null);
        setResult(r.coupon);
      }
    });
  };

  const redeem = () =>
    startTransition(async () => {
      const r = await redeemCoupon(locale, code, locationId || null);
      if ("error" in r) {
        setError(r.error);
        // Someone may have used it meanwhile: show its current state.
        const latest = await checkCoupon(locale, code);
        if ("coupon" in latest) setResult(latest.coupon);
      } else {
        setError(null);
        setResult(r.coupon);
        setJustRedeemed(true);
      }
    });

  const tone = result?.status === "valid" ? "border-mint-200 bg-mint-50" : result ? "border-ember-200 bg-ember-50" : "";

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={check} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2 text-sm font-medium">
          {t("redeem.label")}
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setResult(null);
              setError(null);
            }}
            dir="ltr"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            placeholder="ABCD-2345"
            className="h-12 font-mono text-lg tracking-[0.12em] uppercase"
          />
        </label>
        <Button type="submit" size="lg" variant="outline" disabled={pending || code.trim().length < 8} className="h-12">
          <ScanLine aria-hidden strokeWidth={1.75} />
          {t("redeem.check")}
        </Button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-3">
        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm font-medium text-ember-700">
            <CircleAlert aria-hidden strokeWidth={1.75} className="size-4" />
            {tErrors(error)}
          </p>
        )}
        {result?.status === "not_found" && <p className="text-sm text-muted-foreground">{t("redeem.notFound")}</p>}
        {result && result.status !== "not_found" && (
          <div className={cn("flex flex-col gap-3 rounded-[16px] border p-4", tone)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <bdi dir="ltr" className="font-mono text-lg font-bold tracking-[0.12em]">
                {formatCode(result.code)}
              </bdi>
              <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", result.status === "valid" ? "text-mint-700" : "text-ember-700")}>
                {result.status === "valid" ? <CircleCheck aria-hidden strokeWidth={1.75} className="size-4" /> : <Clock aria-hidden strokeWidth={1.75} className="size-4" />}
                {t(`redeem.${result.status}`)}
              </span>
            </div>
            <p className="font-display text-2xl font-extrabold">{t("off", { amount: discountAmount(locale, result.discountType, result.discountValue) })}</p>
            {textIn(result.note, locale, locale === "ar" ? "en" : "ar") && (
              <p className="text-sm">{textIn(result.note, locale, locale === "ar" ? "en" : "ar")}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {result.status === "redeemed" && result.redeemedAt
                ? t("redeem.redeemedOn", { date: formatDate(locale, result.redeemedAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) })
                : result.status === "expired"
                  ? t("redeem.expiredOn", { date: formatDate(locale, result.expiresAt) })
                  : t("redeem.validUntil", { date: formatDate(locale, result.expiresAt) })}
            </p>
            {justRedeemed && <p className="font-semibold text-mint-700">{t("redeem.success")}</p>}
            {result.status === "valid" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                {locations.length > 1 && (
                  <label className="flex flex-1 flex-col gap-1.5 text-sm font-medium">
                    {t("redeem.location")}
                    <NativeSelect value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                      <option value="">{t("redeem.anyLocation")}</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </label>
                )}
                <Button size="lg" onClick={redeem} disabled={pending}>
                  {t("redeem.use")}
                </Button>
              </div>
            )}
            {result.status !== "valid" && (
              <Button variant="ghost" size="sm" className="self-start" onClick={reset}>
                {t("redeem.another")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
