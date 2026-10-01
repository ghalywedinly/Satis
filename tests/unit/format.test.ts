import { describe, expect, it } from "vitest";
import { formatNumber, formatPercent, formatSar } from "@/lib/i18n/format";

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
