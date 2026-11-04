/**
 * CSAT and NPS from counts. Kept here, not in SQL, so the definitions live in one readable place.
 * - CSAT: share of ratings that are 4 or 5 (out of 5).
 * - NPS: % promoters (9–10) minus % detractors (0–6), from −100 to 100.
 * Both are null when there's nothing to measure, so the UI can say "no data" rather than show 0.
 */

export type ScoreCounts = { csatCount: number; csatSatisfied: number; npsCount: number; promoters: number; detractors: number };

export const csatRatio = (c: Pick<ScoreCounts, "csatCount" | "csatSatisfied">) => (c.csatCount > 0 ? c.csatSatisfied / c.csatCount : null);

export const npsScore = (c: Pick<ScoreCounts, "npsCount" | "promoters" | "detractors">) =>
  c.npsCount > 0 ? Math.round(((c.promoters - c.detractors) / c.npsCount) * 100) : null;

export const averageRating = (sum: number, count: number) => (count > 0 ? sum / count : null);

/** Change from the previous period, or null when either side has no data. */
export const delta = (current: number | null, previous: number | null) => (current === null || previous === null ? null : current - previous);

/** Relative change in a count, or null when there was nothing before. */
export const relativeChange = (current: number, previous: number) => (previous > 0 ? (current - previous) / previous : null);
