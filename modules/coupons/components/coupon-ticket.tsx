"use client";

import { useState } from "react";
import { Check, Copy, Ticket } from "lucide-react";
import { formatDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { textIn } from "@/modules/surveys/definition";
import { formatCode, type Coupon } from "../definition";

export type CouponLabels = {
  eyebrow: string;
  off: string;
  code: string;
  validUntil: string;
  howTo: string;
  keep: string;
  copy: string;
  copied: string;
};

/**
 * The reward on the customer's thank-you screen, styled as a ticket. Labels arrive with their
 * placeholders filled in by the caller ({amount}, {date}, {business}).
 */
export function CouponTicket({ coupon, locale, fallback, labels }: { coupon: Coupon; locale: Locale; fallback: Locale; labels: CouponLabels }) {
  const [copied, setCopied] = useState(false);
  const note = textIn(coupon.note, locale, fallback);
  return (
    <div className="relative w-full max-w-[340px] overflow-hidden rounded-card bg-white text-start text-ink animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex flex-col gap-2 p-5">
        <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Ticket aria-hidden strokeWidth={1.75} className="size-4 text-ember" />
          {labels.eyebrow}
        </span>
        <p className="font-display text-2xl leading-tight font-extrabold">{labels.off}</p>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      {/* Perforation between the reward and the code. */}
      <div aria-hidden className="relative h-0 border-t-2 border-dashed border-sand-200">
        <span className="absolute -start-3 -top-3 size-6 rounded-full bg-ink" />
        <span className="absolute -end-3 -top-3 size-6 rounded-full bg-ink" />
      </div>
      <div className="flex flex-col gap-3 p-5">
        <span className="text-xs text-muted-foreground">{labels.code}</span>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <bdi dir="ltr" className="slice bg-zest px-3 py-1 font-mono text-[22px] font-bold tracking-[0.08em] whitespace-nowrap" data-testid="coupon-code">
            {formatCode(coupon.code)}
          </bdi>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(coupon.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-border px-3 py-2 text-sm font-semibold outline-none hover:bg-sand-100 focus-visible:shadow-focus active:translate-y-px"
          >
            {copied ? <Check aria-hidden strokeWidth={1.75} className="size-4" /> : <Copy aria-hidden strokeWidth={1.75} className="size-4" />}
            <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
          </button>
        </div>
        <p className="text-sm font-medium">{labels.validUntil.replace("{date}", formatDate(locale, coupon.expiresAt))}</p>
        <p className="text-sm text-muted-foreground">
          {labels.howTo} {labels.keep}
        </p>
      </div>
    </div>
  );
}
