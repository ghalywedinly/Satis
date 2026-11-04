"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/** Friendly localized error page; the error itself goes to Sentry, never to the screen. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations();
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-5 px-6">
      <h1 className="text-3xl font-extrabold">{t("errors.page.title")}</h1>
      <p className="text-muted-foreground">{t("errors.page.body")}</p>
      <Button onClick={reset}>{t("common.actions.tryAgain")}</Button>
    </main>
  );
}
