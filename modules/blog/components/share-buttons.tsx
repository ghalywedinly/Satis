"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const button =
  "inline-flex size-11 items-center justify-center rounded-control border border-border bg-white text-ink outline-none transition-colors duration-[140ms] hover:bg-sand-100 focus-visible:shadow-focus active:translate-y-px";

/** Share an article: WhatsApp (most used in Saudi Arabia), LinkedIn, or copy the link. */
export function ShareButtons({ url, title, className }: { url: string; title: string; className?: string }) {
  const t = useTranslations("blog.share");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (old browser or permissions): nothing to do, the address bar still has the link.
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label={t("whatsapp")} title={t("whatsapp")} className={button}>
        <MessageCircle aria-hidden strokeWidth={1.75} className="size-5" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("linkedin")}
        title={t("linkedin")}
        className={button}
      >
        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-5">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M8 10v7M8 7v.01M12 17v-7M12 13.5a2.5 2.5 0 0 1 5 0V17" />
        </svg>
      </a>
      <button type="button" onClick={copy} aria-label={copied ? t("copied") : t("copy")} title={t("copy")} className={button}>
        {copied ? <Check aria-hidden strokeWidth={1.75} className="size-5 text-mint-700" /> : <Link2 aria-hidden strokeWidth={1.75} className="size-5" />}
      </button>
      <span role="status" className="sr-only">
        {copied ? t("copied") : ""}
      </span>
    </div>
  );
}
