import { z } from "zod";

/**
 * Dashboard filters live in the URL. Periods are whole calendar days in Saudi time
 * (UTC+3, no daylight saving): "7" means today and the 6 days before it.
 */

export const PERIODS = ["today", "7", "30", "90", "custom"] as const;
export type Period = (typeof PERIODS)[number];

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Custom ranges are capped so one request can't scan years of data. */
export const MAX_CUSTOM_DAYS = 366;

// A real calendar date: "2026-02-30" is rejected rather than rolled over to March.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const time = Date.parse(`${s}T00:00:00Z`);
    return !Number.isNaN(time) && new Date(time).toISOString().startsWith(s);
  });
const blank = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blank, schema.optional()).catch(undefined);

const schema = z.object({
  period: z.preprocess(blank, z.enum(PERIODS).default("30")).catch("30"),
  from: optional(isoDate),
  to: optional(isoDate),
  location: optional(z.uuid()),
  survey: optional(z.uuid()),
});

export type DashboardFilters = z.infer<typeof schema>;
export type Range = { from: Date; to: Date; days: number };

export function parseDashboardFilters(params: Record<string, string | string[] | undefined>): DashboardFilters {
  const first = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const filters = schema.parse(first);
  // A custom period needs both dates; otherwise fall back to the default.
  if (filters.period === "custom" && (!filters.from || !filters.to)) return { ...filters, period: "30", from: undefined, to: undefined };
  if (filters.period !== "custom") return { ...filters, from: undefined, to: undefined };
  return filters;
}

/** Saudi calendar date (YYYY-MM-DD) of an instant. */
export const riyadhDate = (instant: Date) => new Date(instant.getTime() + RIYADH_OFFSET_MS).toISOString().slice(0, 10);

/** The instant a Saudi calendar day starts. */
const startOfRiyadhDay = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - RIYADH_OFFSET_MS);

/** The time range a filter covers: [from, to), whole Saudi days. */
export function rangeFor(filters: DashboardFilters, now: Date = new Date()): Range {
  const today = riyadhDate(now);
  const tomorrow = new Date(startOfRiyadhDay(today).getTime() + DAY_MS);
  if (filters.period === "custom" && filters.from && filters.to) {
    let [first, last] = filters.from <= filters.to ? [filters.from, filters.to] : [filters.to, filters.from];
    if (last > today) last = today;
    if (first > last) first = last;
    const from = startOfRiyadhDay(first);
    let to = new Date(startOfRiyadhDay(last).getTime() + DAY_MS);
    if ((to.getTime() - from.getTime()) / DAY_MS > MAX_CUSTOM_DAYS) to = new Date(from.getTime() + MAX_CUSTOM_DAYS * DAY_MS);
    return { from, to, days: Math.round((to.getTime() - from.getTime()) / DAY_MS) };
  }
  const days = filters.period === "today" ? 1 : Number(filters.period === "custom" ? "30" : filters.period);
  return { from: new Date(tomorrow.getTime() - days * DAY_MS), to: tomorrow, days };
}

/** The query string for `filters`, leaving out defaults. */
export function dashboardQuery(filters: Partial<DashboardFilters>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (!value || (key === "period" && value === "30")) continue;
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
