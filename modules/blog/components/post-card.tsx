import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { Post } from "../types";
import { PostCover } from "./cover";
import { PostDate, PostKicker } from "./post-meta";

/** A post in a grid: cover, topic, title, excerpt, date. The whole card is one link. */
export function PostCard({ post, locale, headingLevel = 3 }: { post: Post; locale: Locale; headingLevel?: 2 | 3 }) {
  const { title, excerpt } = post.content[locale];
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-white outline-none transition-[border-color,transform] duration-[140ms] ease-[var(--ease-standard)] hover:border-ink-300 focus-visible:shadow-focus active:translate-y-px"
    >
      <PostCover post={post} locale={locale} className="h-[180px]" />
      <div className="flex flex-1 flex-col gap-2.5 p-5 sm:p-6">
        <PostKicker post={post} locale={locale} />
        <Heading className="text-xl leading-snug font-bold text-ink group-hover:text-ultramarine">{title}</Heading>
        <p className="text-[15px] leading-relaxed text-ink-600">{excerpt}</p>
        <PostDate post={post} locale={locale} className="mt-auto pt-2 text-[13px] text-ink-500" />
      </div>
    </Link>
  );
}
