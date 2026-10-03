"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import arCommon from "@/locales/ar/common.json";
import arErrors from "@/locales/ar/errors.json";
import enCommon from "@/locales/en/common.json";
import enErrors from "@/locales/en/errors.json";
import "./globals.css";

/** Last-resort error page when the root layout itself fails. Bilingual, no providers available. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 px-6">
          <section className="flex flex-col gap-2">
            <h1 className="text-3xl font-extrabold">{arErrors.page.title}</h1>
            <p>{arErrors.page.body}</p>
          </section>
          <section lang="en" dir="ltr" className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold">{enErrors.page.title}</h2>
            <p>{enErrors.page.body}</p>
          </section>
          <button type="button" onClick={reset} className="self-start rounded-control bg-ultramarine px-4 py-2.5 font-semibold text-white">
            {arCommon.actions.tryAgain} · <span lang="en">{enCommon.actions.tryAgain}</span>
          </button>
        </main>
      </body>
    </html>
  );
}
