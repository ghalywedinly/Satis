import { describe, expect, it } from "vitest";
import { formatCount, formatDate, intlLocale, formatNumber, formatPercent, formatSar } from "@/lib/i18n/format";

describe("number formatting", () => {
  it("uses Western digits with grouping in both languages", () => {
    expect(formatNumber("ar", 2140)).toBe("2,140");
    expect(formatNumber("en", 2140)).toBe("2,140");
  });

  it("writes percentages without a space", () => {
    expect(formatPercent("en", 0.924)).toBe("92.4%");
    expect(formatPercent("ar", 0.924)).toBe("92.4%");
  });

  it("formats Saudi Riyal per language from halalas", () => {
    expect(formatSar("ar", 15000)).toBe("150 ر.س");
    expect(formatSar("en", 15000)).toBe("SAR 150");
    expect(formatSar("en", 14950)).toBe("SAR 149.50");
  });
});

describe("dates and counts", () => {
  it("uses Western digits and the Gregorian calendar in Arabic too", () => {
    expect(formatDate("ar", "2026-10-08T12:00:00Z")).toMatch(/^8 .+ 2026$/);
    expect(formatDate("ar", "2026-10-08T12:00:00Z")).not.toContain("هـ");
    expect(new Intl.DateTimeFormat(intlLocale("ar")).resolvedOptions().calendar).toBe("gregory");
    expect(formatCount("ar", 12)).toBe("12");
  });
});
