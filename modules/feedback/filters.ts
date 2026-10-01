import { z } from "zod";

/**
 * Inbox filters live in the URL (?status=new&period=30…), so a filtered view can be
 * bookmarked, shared with a teammate and survives a refresh. Invalid values are ignored.
 */

export const STATUSES = ["new", "in_progress", "resolved"] as const;
export const SENTIMENTS = ["positive", "neutral", "negative"] as const;
export const PERIODS = ["7", "30", "90", "all"] as const;
export const PAGE_SIZE = 25;

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema.optional()).catch(undefined);
const flag = z.preprocess((v) => v === "1" || v === "on", z.boolean()).catch(false);

const schema = z.object({
  status: optional(z.enum(STATUSES)),
  sentiment: optional(z.enum(SENTIMENTS)),
  survey: optional(z.uuid()),
  location: optional(z.uuid()),
  tag: optional(z.uuid()),
  period: z.preprocess(blankToUndefined, z.enum(PERIODS).default("30")).catch("30"),
  q: optional(z.string().max(100)),
  unread: flag,
  important: flag,
  comments: flag,
  page: z.coerce.number().int().min(1).max(1000).catch(1),
});

export type InboxFilters = z.infer<typeof schema>;

type RawParams = Record<string, string | string[] | undefined>;

export function parseFilters(params: RawParams): InboxFilters {
  const first = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  return schema.parse(first);
}

/** The query string for `filters`, leaving out defaults so URLs stay short. */
export function filtersToQuery(filters: Partial<InboxFilters>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === false || value === "") continue;
    if (key === "period" && value === "30") continue;
    if (key === "page" && value === 1) continue;
    params.set(key, value === true ? "1" : String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Whether anything narrows the list beyond the default period (for the empty state). */
export const isFiltered = (f: InboxFilters) =>
  Boolean(f.status || f.sentiment || f.survey || f.location || f.tag || f.q || f.unread || f.important || f.comments || f.period !== "30");

/**
 * Escapes LIKE wildcards so a search for "50%" finds "50%", not everything.
 * "*" is dropped: the database API treats it as a wildcard too.
 */
export const likePattern = (q: string) => `%${q.replace(/\*/g, "").replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
