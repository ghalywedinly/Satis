import type { BusinessType } from "@/types/database";

/** The smallest number of ratings before a score is shown (same as private.score_min_ratings()). */
export const MIN_RATINGS = 25;

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Turns a brand name into a page address suggestion (Latin letters and digits only). */
export function suggestSlug(name: string) {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return slug.length >= 3 ? slug : "";
}

export type DirectoryEntry = {
  slug: string;
  name: string;
  type: BusinessType;
  cities: string[];
  ratings: number;
  satisfied: number;
  score: number | null;
};

export type Directory = {
  ratings: number;
  businesses: number;
  cities: number;
  types: Partial<Record<BusinessType, number>>;
  results: DirectoryEntry[];
};

export type ScoreProfile = {
  name: string;
  type: BusinessType;
  about: string | null;
  website: string | null;
  since: number;
  minRatings: number;
  ratings: number;
  score: number | null;
  satisfied: number;
  /** Ratings with 1, 2, 3, 4 and 5 stars. */
  distribution: [number, number, number, number, number];
  months: { month: string; ratings: number; score: number | null }[];
  locations: { name: string; city: string | null; ratings: number; score: number | null }[];
  reviews: number;
  lowReviews: number;
  lowAnswered: number;
};

export type Review = {
  id: string;
  rating: number;
  name: string | null;
  comment: string;
  at: string;
  location: string;
  city: string | null;
  reply: string | null;
  replyAt: string | null;
};

export type ReviewPage = { total: number; items: Review[] };

export type ScoreBadge = { name: string; ratings: number; satisfied: number; score: number | null };

/** "4.7" with Western digits in both languages. */
export const oneDecimal = (value: number) => value.toFixed(1);
