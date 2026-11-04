"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/lib/forms";
import { acceptInvitation } from "../actions";

export function AcceptInvitation({ token }: { token: string }) {
  const t = useTranslations("invite");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      {error && <FormAlert tone="error">{te(error)}</FormAlert>}
      <Button size="lg" disabled={pending} onClick={() => startTransition(async () => setError(await acceptInvitation(locale, token)))}>
        {t("accept")}
      </Button>
    </div>
  );
}
