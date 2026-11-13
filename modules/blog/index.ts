import type { Locale } from "@/lib/i18n/routing";
import { beforeAndAfterStudies } from "./posts/before-and-after-studies";
import { csatVsNps } from "./posts/csat-vs-nps";
import { howToCalculateNps } from "./posts/how-to-calculate-nps";
import { restaurantFeedbackQuestions } from "./posts/restaurant-feedback-questions";
import { BLOG_CATEGORIES, type Block, type BlogCategory, type Post } from "./types";

export { BLOG_CATEGORIES, type Block, type BlogCategory, type Post } from "./types";

/**
 * Every published post. To add one: write a file in ./posts (Arabic and English),
 * import it here, and add it to the list. Order doesn't matter: posts are sorted by date.
 */
const POSTS: Post[] = [howToCalculateNps, restaurantFeedbackQuestions, beforeAndAfterStudies, csatVsNps];

/** All posts, newest first. */
export function allPosts(): Post[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getPost(slug: string): Post | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export const isBlogCategory = (value: unknown): value is BlogCategory =>
  typeof value === "string" && (BLOG_CATEGORIES as readonly string[]).includes(value);

/** Lower-cases and folds Arabic letter variants so "احصاء" finds "إحصاء". */
function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

/** Posts in a category and/or matching a search (title and excerpt, in the reader's language). */
export function findPosts(locale: Locale, { category, query }: { category?: BlogCategory; query?: string }): Post[] {
  const q = query ? normalize(query) : "";
  return allPosts().filter((post) => {
    if (category && post.category !== category) return false;
    if (!q) return true;
    const { title, excerpt } = post.content[locale];
    return normalize(`${title} ${excerpt}`).includes(q);
  });
}

/** Other posts to read next: same category first, then the newest. */
export function relatedPosts(post: Post, count = 3): Post[] {
  const others = allPosts().filter((p) => p.slug !== post.slug);
  const same = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...same, ...rest].slice(0, count);
}

/** Section headings, for the article's table of contents. */
export const headings = (blocks: Block[]) =>
  blocks.flatMap((block) => (block.type === "h2" ? [{ id: block.id, text: block.text }] : []));

/** Splits "[[…]]" marks out of a text: those parts are numbers or Latin that must read left to right. */
export function splitInline(text: string): { text: string; ltr: boolean }[] {
  return text
    .split(/(\[\[[^\]]+\]\])/)
    .filter(Boolean)
    .map((part) => (part.startsWith("[[") && part.endsWith("]]") ? { text: part.slice(2, -2), ltr: true } : { text: part, ltr: false }));
}

/** Plain text without the marks, for meta descriptions and structured data. */
export const plainText = (text: string) => text.replace(/\[\[([^\]]+)\]\]/g, "$1");
