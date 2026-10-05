"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/lib/forms";

/**
 * A button that asks for confirmation before running `onConfirm` (a server action returning
 * an error key or null). Shows the translated error inside the dialog if it fails.
 */
export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<ErrorKey | null>;
}) {
  const te = useTranslations("errors");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <FormAlert tone="error">{te(error)}</FormAlert>}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">{cancelLabel}</Button>
          </AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await onConfirm();
                if (result) setError(result);
                else setOpen(false);
              })
            }
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
