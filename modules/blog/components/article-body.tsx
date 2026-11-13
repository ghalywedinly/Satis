import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import type { Block } from "../types";
import { Inline } from "./inline";

const GROUP_TONE = { mint: "text-mint-700", neutral: "text-ink-500", ember: "text-ember-700" } as const;

/** The "Book a meeting" box inside an article. */
export async function ArticleCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "blog.cta" });
  return (
    <aside aria-label={t("title")} className="flex flex-wrap items-center gap-5 rounded-card bg-ink p-6 text-sand sm:p-7">
      <div className="flex min-w-[240px] flex-1 flex-col gap-1.5">
        <p className="text-xl leading-snug font-bold">{t("title")}</p>
        <p className="text-[15px] leading-relaxed text-ink-200">{t("body")}</p>
      </div>
      <Button asChild className="h-12 px-5 text-base">
        <Link href="/book">
          {t("action")}
          <ArrowRight aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
        </Link>
      </Button>
    </aside>
  );
}

/** Renders a post's blocks. Headings carry ids so the table of contents can link to them. */
export function ArticleBody({ blocks, locale }: { blocks: Block[]; locale: Locale }) {
  return (
    <div className="flex min-w-0 flex-col gap-6 text-[17px] leading-[1.95] text-ink-800 sm:text-lg">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} id={block.id} className="scroll-mt-24 pt-2 text-2xl leading-snug font-bold text-ink sm:text-[28px]">
                <Inline text={block.text} />
              </h2>
            );
          case "p":
            return (
              <p key={i}>
                <Inline text={block.text} />
              </p>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List key={i} className={cn("flex flex-col gap-2 ps-6", block.ordered ? "list-decimal" : "list-disc", "marker:text-ink-400")}>
                {block.items.map((item, j) => (
                  <li key={j} className="ps-1">
                    <Inline text={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "callout":
            return (
              <div key={i} className="flex flex-col gap-2 rounded-card bg-ultra-50 p-5 sm:p-6">
                <p className="text-lg leading-snug font-bold text-ink sm:text-xl">
                  <Inline text={block.title} />
                </p>
                <p className="text-base leading-relaxed text-ink-700">
                  <Inline text={block.text} />
                </p>
              </div>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-s-4 border-ink ps-5 text-xl leading-relaxed font-semibold text-ink sm:text-[22px]">
                <Inline text={block.text} />
              </blockquote>
            );
          case "groups":
            return (
              <div key={i} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {block.items.map((item) => (
                  <div key={item.value} className="flex flex-col gap-1 rounded-card border border-border bg-white p-5">
                    <span dir="ltr" className={cn("font-display text-3xl font-extrabold tracking-[-0.03em] rtl:text-end", GROUP_TONE[item.tone])}>
                      {item.value}
                    </span>
                    <span className="text-[17px] font-bold text-ink">
                      <Inline text={item.label} />
                    </span>
                    <span className="text-[15px] leading-relaxed text-ink-600">
                      <Inline text={item.text} />
                    </span>
                  </div>
                ))}
              </div>
            );
          case "cta":
            return <ArticleCta key={i} locale={locale} />;
        }
      })}
    </div>
  );
}
