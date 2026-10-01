import { describe, expect, it } from "vitest";
import { csatRatio, delta, npsScore, relativeChange } from "@/modules/analytics/metrics";
import { dashboardQuery, parseDashboardFilters, rangeFor, riyadhDate } from "@/modules/analytics/period";

describe("CSAT and NPS", () => {
  it("CSAT is the share of 4s and 5s", () => {
    expect(csatRatio({ csatCount: 4, csatSatisfied: 3 })).toBe(0.75);
    expect(csatRatio({ csatCount: 0, csatSatisfied: 0 })).toBeNull();
  });

  it("NPS is promoters minus detractors, rounded", () => {
    expect(npsScore({ npsCount: 3, promoters: 2, detractors: 1 })).toBe(33);
    expect(npsScore({ npsCount: 2, promoters: 0, detractors: 2 })).toBe(-100);
    expect(npsScore({ npsCount: 0, promoters: 0, detractors: 0 })).toBeNull();
  });

  it("changes need both periods", () => {
    expect(delta(0.8, 0.6)).toBeCloseTo(0.2);
    expect(delta(0.8, null)).toBeNull();
    expect(relativeChange(15, 10)).toBe(0.5);
    expect(relativeChange(3, 0)).toBeNull();
  });
});

describe("dashboard periods", () => {
  // 23:30 on 10 March in Riyadh is 20:30 UTC.
  const now = new Date("2026-03-10T20:30:00Z");

  it("uses Saudi calendar days", () => {
    expect(riyadhDate(now)).toBe("2026-03-10");
    expect(riyadhDate(new Date("2026-03-10T21:00:00Z"))).toBe("2026-03-11");
  });

  it("today and the last N days end at Saudi midnight tonight", () => {
    expect(rangeFor(parseDashboardFilters({ period: "today" }), now)).toEqual({
      from: new Date("2026-03-09T21:00:00Z"),
      to: new Date("2026-03-10T21:00:00Z"),
      days: 1,
    });
    const week = rangeFor(parseDashboardFilters({ period: "7" }), now);
    expect(week.from).toEqual(new Date("2026-03-03T21:00:00Z"));
    expect(week.days).toBe(7);
  });

  it("defaults to the last 30 days and ignores invalid values", () => {
    const filters = parseDashboardFilters({ period: "365", location: "x", survey: "" });
    expect(filters).toEqual({ period: "30", from: undefined, to: undefined, location: undefined, survey: undefined });
    expect(rangeFor(filters, now).days).toBe(30);
    expect(dashboardQuery(filters)).toBe("");
  });

  it("custom ranges include both days, swap reversed dates and stop at today", () => {
    const range = rangeFor(parseDashboardFilters({ period: "custom", from: "2026-03-12", to: "2026-03-01" }), now);
    expect(range).toEqual({ from: new Date("2026-02-28T21:00:00Z"), to: new Date("2026-03-10T21:00:00Z"), days: 10 });
  });

  it("custom ranges need both dates and are capped at a year", () => {
    expect(parseDashboardFilters({ period: "custom", from: "2026-03-01" }).period).toBe("30");
    expect(parseDashboardFilters({ period: "custom", from: "2026-02-30", to: "2026-03-01" }).period).toBe("30");
    expect(rangeFor(parseDashboardFilters({ period: "custom", from: "2020-01-01", to: "2026-03-10" }), now).days).toBe(366);
  });

  it("other periods drop stray dates from the URL", () => {
    expect(dashboardQuery(parseDashboardFilters({ period: "7", from: "2026-03-01", to: "2026-03-02" }))).toBe("?period=7");
  });
});
