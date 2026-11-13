import { getTranslations } from "next-intl/server";
import { formatCount, formatDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import type { Post } from "../types";

/** "NPS guide · 6 min read" above a title. */
export async function PostKicker({ post, locale, className }: { post: Post; locale: Locale; className?: string }) {
  const t = await getTranslations({ locale, namespace: "blog" });
  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-[13px]", className)}>
      <span className="font-semibold text-ultramarine">{t(`categories.${post.category}`)}</span>
      <span aria-hidden className="text-ink-300">
        {"·"}
      </span>
      <span className="text-ink-500">{t("readTime", { minutes: formatCount(locale, post.readMinutes) })}</span>
    </div>
  );
}

/** The publication date as a <time>, in the reader's language with Western digits. */
export function PostDate({ post, locale, className }: { post: Post; locale: Locale; className?: string }) {
  return (
    <time dateTime={post.date} className={className}>
      {formatDate(locale, `${post.date}T12:00:00+03:00`, { day: "numeric", month: "long", year: "numeric" })}
    </time>
  );
}
