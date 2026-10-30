"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { idle } from "@/lib/forms";
import { saveLocation } from "../actions";

export type LocationValues = { id: string; name: string; city: string | null; address: string | null };

/** Add a location, or edit `location` when given. */
export function LocationDialog({ location }: { location?: LocationValues }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <LocationTrigger location={location} />
      <DialogContent>{open && <LocationForm location={location} onDone={() => setOpen(false)} />}</DialogContent>
    </Dialog>
  );
}

function LocationTrigger({ location }: { location?: LocationValues }) {
  const t = useTranslations("locations");
  return location ? (
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label={t("editNamed", { name: location.name })}>
        <Pencil aria-hidden strokeWidth={1.75} />
      </Button>
    </DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      <Button>
        <Plus aria-hidden strokeWidth={1.75} />
        {t("add")}
      </Button>
    </DialogTrigger>
  );
}

function LocationForm({ location, onDone }: { location?: LocationValues; onDone: () => void }) {
  const t = useTranslations("locations");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [state, action] = useActionState(saveLocation.bind(null, locale), idle);

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{location ? t("edit") : t("add")}</DialogTitle>
      </DialogHeader>
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      {location && <input type="hidden" name="locationId" value={location.id} />}
      <FormField
        label={t("fields.name")}
        name="name"
        required
        maxLength={120}
        defaultValue={state.values?.name ?? location?.name}
        error={state.fieldErrors?.name}
      />
      <FormField
        label={t("fields.city")}
        name="city"
        autoComplete="address-level2"
        maxLength={80}
        defaultValue={state.values?.city ?? location?.city ?? ""}
        error={state.fieldErrors?.city}
      />
      <FormField
        label={t("fields.address")}
        name="address"
        autoComplete="street-address"
        maxLength={200}
        defaultValue={state.values?.address ?? location?.address ?? ""}
        error={state.fieldErrors?.address}
      />
      <DialogFooter className="gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t("cancel")}
          </Button>
        </DialogClose>
        <SubmitButton size="default">{location ? t("save") : t("create")}</SubmitButton>
      </DialogFooter>
    </form>
  );
}
