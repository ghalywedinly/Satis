"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ValidationKey } from "@/modules/auth/schemas";

type FormFieldProps = Omit<React.ComponentProps<typeof Input>, "id"> & {
  label: string;
  hint?: string;
  error?: ValidationKey;
};

/** Labelled input with hint and translated validation error, wired up for screen readers. */
export function FormField({ label, hint, error, ...inputProps }: FormFieldProps) {
  const t = useTranslations("validation");
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...inputProps} />
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-ember-700">
          {t(error)}
        </p>
      )}
    </div>
  );
}
