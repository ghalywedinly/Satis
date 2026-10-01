"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, Copy, Download, ExternalLink, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { setLinkActive } from "../actions";

export type ShareLink = { id: string; code: string; url: string; locationName: string; isActive: boolean };

export function ShareCard({ surveyId, link, canManage }: { surveyId: string; link: ShareLink; canManage: boolean }) {
  const t = useTranslations("surveys.share");
  const locale = useLocale() as Locale;
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  // Reflect the switch immediately; the server confirms (or reverts) on refresh.
  const [isActive, setOptimisticActive] = useOptimistic(link.isActive);

  return (
    <li className="flex flex-col gap-4 rounded-card border border-border bg-white p-5 sm:flex-row sm:items-start">
      {/* eslint-disable-next-line @next/next/no-img-element -- authenticated SVG from our own API, not optimizable */}
      <img src={`/api/qr/${link.code}?format=svg`} alt="" width={140} height={140} className="size-[140px] shrink-0 self-center rounded-tile border border-border sm:self-start" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-sans text-lg font-semibold">{link.locationName}</h3>
          <bdi dir="ltr" className="truncate text-sm text-muted-foreground">
            {link.url}
          </bdi>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-ultramarine"
            checked={isActive}
            disabled={!canManage || pending}
            aria-label={t("toggle", { location: link.locationName })}
            onChange={(e) => {
              const active = e.target.checked;
              startTransition(async () => {
                setOptimisticActive(active);
                await setLinkActive(locale, link.id, active);
              });
            }}
          />
          <span className={isActive ? "text-mint-700" : "text-muted-foreground"}>{isActive ? t("active") : t("inactive")}</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await navigator.clipboard.writeText(link.url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check aria-hidden strokeWidth={1.75} /> : <Copy aria-hidden strokeWidth={1.75} />}
            <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/qr/${link.code}?format=png&download=1`} download>
              <Download aria-hidden strokeWidth={1.75} />
              {t("downloadPng")}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/qr/${link.code}?format=svg&download=1`} download>
              <Download aria-hidden strokeWidth={1.75} />
              {t("downloadSvg")}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/surveys/${surveyId}/print/${link.id}`}>
              <Printer aria-hidden strokeWidth={1.75} />
              {t("print")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={link.url} target="_blank" rel="noopener">
              <ExternalLink aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
              {t("open")}
            </a>
          </Button>
        </div>
      </div>
    </li>
  );
}
