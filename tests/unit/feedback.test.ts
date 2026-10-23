import { describe, expect, it } from "vitest";
import { filtersToQuery, isFiltered, likePattern, parseFilters } from "@/modules/feedback/filters";

describe("inbox filters", () => {
  it("defaults to the last 30 days, first page, nothing else", () => {
    const filters = parseFilters({});
    expect(filters).toMatchObject({ period: "30", page: 1, unread: false, important: false, comments: false });
    expect(isFiltered(filters)).toBe(false);
    expect(filtersToQuery(filters)).toBe("");
  });

  it("reads valid values and ignores invalid or empty ones", () => {
    const filters = parseFilters({
      status: "resolved",
      sentiment: "angry",
      survey: "not-a-uuid",
      location: "8f0c2b8e-7a51-4d61-9a43-2f1d8f8f7f10",
      period: "365",
      q: "  slow  ",
      tag: "",
      unread: "1",
      page: "-3",
    });
    expect(filters).toMatchObject({
      status: "resolved",
      sentiment: undefined,
      survey: undefined,
      location: "8f0c2b8e-7a51-4d61-9a43-2f1d8f8f7f10",
      period: "30",
      q: "slow",
      tag: undefined,
      unread: true,
      page: 1,
    });
    expect(isFiltered(filters)).toBe(true);
  });

  it("takes the first value of repeated parameters", () => {
    expect(parseFilters({ status: ["new", "resolved"] }).status).toBe("new");
  });

  it("round-trips through the query string, leaving out defaults", () => {
    const filters = parseFilters({ status: "new", important: "1", period: "90", page: "2", q: "خدمة" });
    const query = filtersToQuery(filters);
    expect(query).toBe(`?status=new&period=90&q=${encodeURIComponent("خدمة")}&important=1&page=2`);
    expect(parseFilters(Object.fromEntries(new URLSearchParams(query)))).toEqual(filters);
  });

  it("searches literally, so wildcards in the text don't match everything", () => {
    expect(likePattern("50%_off")).toBe("%50\\%\\_off%");
    expect(likePattern("a*b")).toBe("%ab%");
  });
});
