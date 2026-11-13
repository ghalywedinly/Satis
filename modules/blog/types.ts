import type { Locale } from "@/lib/i18n/routing";

/** Topics a post can belong to. Labels live in locales/{ar,en}/blog.json under `categories`. */
export const BLOG_CATEGORIES = ["nps", "experience", "restaurants", "stories", "product"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** Cover backgrounds, drawn with slices (no stock photos). See components/cover.tsx. */
export type CoverTone = "ink" | "ultra" | "ember" | "mint" | "sand" | "grape";

/**
 * Inline text. Wrap numbers, formulas, codes or Latin words that sit inside Arabic in
 * [[double brackets]]: they render as <bdi dir="ltr"> so the order never flips.
 */
export type Inline = string;

export type Block =
  | { type: "h2"; id: string; text: Inline }
  | { type: "p"; text: Inline }
  | { type: "list"; items: Inline[]; ordered?: boolean }
  | { type: "callout"; title: Inline; text: Inline }
  | { type: "quote"; text: Inline }
  | { type: "groups"; items: { value: string; label: Inline; text: Inline; tone: "mint" | "neutral" | "ember" }[] }
  /** The "Book a meeting" box. Its copy comes from blog.json. */
  | { type: "cta" };

export type PostContent = {
  title: string;
  /** One or two sentences: the card text and the meta description. */
  excerpt: string;
  /** The large word on the cover. */
  mark: string;
  blocks: Block[];
};

export type Post = {
  slug: string;
  category: BlogCategory;
  /** Publication date, YYYY-MM-DD (Riyadh). */
  date: string;
  readMinutes: number;
  cover: CoverTone;
  /** Optional score on a Zest plate beside the mark (the one delight element of the view). */
  badge?: string;
  content: Record<Locale, PostContent>;
};
