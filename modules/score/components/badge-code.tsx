"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** The snippet a brand pastes into its website, with a full/small choice and a copy button. */
export function BadgeCode({ origin, slug, preview }: { origin: string; slug: string; preview: { full: React.ReactNode; small: React.ReactNode } }) {
  const t = useTranslations("score.settings.badge");
  const [style, setStyle] = useState<"full" | "small">("full");
  const [copied, setCopied] = useState(false);
  const code = `<script src="${origin}/badge.js" async></script>\n<div data-satis-score="${slug}" data-style="${style}"></div>`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-sm font-semibold">{t("style")}</legend>
          <div className="flex gap-2">
            {(["full", "small"] as const).map((s) => (
              <label
                key={s}
                className={cn(
                  "cursor-pointer rounded-control border px-4 py-2 text-sm font-semibold has-[:focus-visible]:shadow-focus",
                  style === s ? "border-ultramarine bg-ultra-50 text-ultramarine" : "border-ink-100 hover:bg-ink-50",
                )}
              >
                <input type="radio" name="badge-style" value={s} checked={style === s} onChange={() => setStyle(s)} className="sr-only" />
                {t(s)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">{t("code")}</span>
          <pre dir="ltr" className="overflow-x-auto rounded-control bg-ink p-4 text-start font-mono text-xs leading-relaxed text-ink-100">
            <code>{code}</code>
          </pre>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-control bg-ultramarine px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-ultra-600 focus-visible:shadow-focus active:translate-y-px"
        >
          {copied ? <Check aria-hidden strokeWidth={1.75} className="size-4" /> : <Copy aria-hidden strokeWidth={1.75} className="size-4" />}
          <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
        </button>
      </div>
      <div className="flex flex-col gap-3 rounded-card bg-ink-50 p-5">
        <span className="text-[13px] font-semibold text-ink-500">{t("preview")}</span>
        <div className="flex min-h-32 items-center justify-center rounded-control bg-white p-6">{preview[style]}</div>
      </div>
    </div>
  );
}
