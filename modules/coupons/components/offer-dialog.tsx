"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { idle } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { saveOffer } from "../actions";
import { discountAmount, type DiscountType } from "../definition";
import { toWesternDigits } from "../schemas";

type Option = { id: string; name: string };
export type OfferValues = {
  id: string;
  surveyId: string;
  locationId: string | null;
  discountType: DiscountType;
  discountValue: number;
  validDays: number;
  usageLimit: number | null;
  noteAr: string;
  noteEn: string;
};

/** Create a reward, or edit `offer` when given. */
export function OfferDialog({ offer, surveys, locations }: { offer?: OfferValues; surveys: Option[]; locations: Option[] }) {
  const t = useTranslations("coupons");
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {offer ? (
          <Button variant="ghost" size="sm">
            <Pencil aria-hidden strokeWidth={1.75} />
            {t("offers.edit")}
          </Button>
        ) : (
          <Button>
            <Plus aria-hidden strokeWidth={1.75} />
            {t("offers.create")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        {open && <OfferForm offer={offer} surveys={surveys} locations={locations} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function OfferForm({ offer, surveys, locations, onDone }: { offer?: OfferValues; surveys: Option[]; locations: Option[]; onDone: () => void }) {
  const t = useTranslations("coupons.form");
  const tc = useTranslations("coupons");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [state, action] = useActionState(saveOffer.bind(null, locale), idle);
  const [type, setType] = useState<DiscountType>((state.values?.discountType as DiscountType) ?? offer?.discountType ?? "percent");
  const initialValue = state.values?.discountValue ?? (offer ? String(offer.discountType === "amount" ? offer.discountValue / 100 : offer.discountValue) : "15");
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  const parsed = Number(toWesternDigits(value));
  const preview = Number.isFinite(parsed) && parsed > 0 ? tc("off", { amount: discountAmount(locale, type, type === "amount" ? Math.round(parsed * 100) : parsed) }) : null;

  if (surveys.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{t("create")}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">{t("noSurveys")}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{offer ? t("edit") : t("create")}</DialogTitle>
      </DialogHeader>
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      {offer && <input type="hidden" name="offerId" value={offer.id} />}

      <div className="flex flex-col gap-2">
        <Label htmlFor="offer-survey">{t("survey")}</Label>
        {offer ? (
          <>
            <input type="hidden" name="surveyId" value={offer.surveyId} />
            <p id="offer-survey" className="font-semibold">
              {surveys.find((s) => s.id === offer.surveyId)?.name}
            </p>
          </>
        ) : (
          <NativeSelect id="offer-survey" name="surveyId" defaultValue={state.values?.surveyId ?? surveys[0].id}>
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        )}
        <p className="text-xs text-muted-foreground">{t("surveyHint")}</p>
      </div>

      {locations.length > 1 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="offer-location">{t("location")}</Label>
          <NativeSelect id="offer-location" name="locationId" defaultValue={state.values?.locationId ?? offer?.locationId ?? ""}>
            <option value="">{t("allLocations")}</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t("discountType")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["percent", "amount"] as const).map((option) => (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-control border px-3 py-2.5 text-sm font-semibold has-[:focus-visible]:shadow-focus",
                type === option ? "border-ultramarine bg-ultra-50" : "border-input",
              )}
            >
              <input type="radio" name="discountType" value={option} checked={type === option} onChange={() => setType(option)} className="accent-ultramarine" />
              {t(option)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t("value")}
          name="discountValue"
          inputMode="decimal"
          dir="ltr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={state.fieldErrors?.discountValue}
        />
        <FormField
          label={t("validDays")}
          name="validDays"
          inputMode="numeric"
          dir="ltr"
          defaultValue={state.values?.validDays ?? String(offer?.validDays ?? 30)}
          error={state.fieldErrors?.validDays}
        />
      </div>
      <FormField
        label={t("usageLimit")}
        hint={t("usageLimitHint")}
        name="usageLimit"
        inputMode="numeric"
        dir="ltr"
        defaultValue={state.values?.usageLimit ?? (offer?.usageLimit ? String(offer.usageLimit) : "")}
        error={state.fieldErrors?.usageLimit}
      />
      <FormField
        label={t("noteAr")}
        name="noteAr"
        dir="rtl"
        lang="ar"
        maxLength={120}
        placeholder={t("notePlaceholder")}
        defaultValue={state.values?.noteAr ?? offer?.noteAr ?? ""}
        error={state.fieldErrors?.noteAr}
      />
      <FormField
        label={t("noteEn")}
        name="noteEn"
        dir="ltr"
        lang="en"
        maxLength={120}
        defaultValue={state.values?.noteEn ?? offer?.noteEn ?? ""}
        error={state.fieldErrors?.noteEn}
      />

      {preview && (
        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-ink px-4 py-3 text-sand">
          <span className="text-sm text-ink-300">{t("preview")}</span>
          <span className="font-display text-lg font-extrabold">{preview}</span>
        </div>
      )}

      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t("cancel")}
          </Button>
        </DialogClose>
        <SubmitButton size="default">{offer ? t("save") : t("create")}</SubmitButton>
      </DialogFooter>
    </form>
  );
}
