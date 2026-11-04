import { describe, expect, it } from "vitest";
import { discountAmount, formatCode } from "@/modules/coupons/definition";
import { couponCodeSchema, offerSchema, toWesternDigits } from "@/modules/coupons/schemas";

const base = {
  surveyId: "8f0c2b8e-7a51-4d61-9a43-2f1d8f8f7f10",
  locationId: "",
  discountType: "percent",
  discountValue: "15",
  validDays: "30",
  usageLimit: "",
  noteAr: "",
  noteEn: "",
};

describe("coupon offers", () => {
  it("accepts a percentage and stores no location for all locations", () => {
    const offer = offerSchema.parse(base);
    expect(offer).toMatchObject({ discountType: "percent", discountValue: 15, validDays: 30, usageLimit: null, locationId: null });
  });

  it("stores fixed amounts in halalas, including decimals", () => {
    expect(offerSchema.parse({ ...base, discountType: "amount", discountValue: "19.99" }).discountValue).toBe(1999);
    expect(offerSchema.parse({ ...base, discountType: "amount", discountValue: "20" }).discountValue).toBe(2000);
  });

  it("reads Arabic-Indic digits typed on an Arabic keyboard", () => {
    expect(toWesternDigits("١٥")).toBe("15");
    expect(offerSchema.parse({ ...base, discountValue: "١٥", validDays: "٣٠", usageLimit: "١٠٠" })).toMatchObject({ discountValue: 15, validDays: 30, usageLimit: 100 });
  });

  it("rejects out-of-range values with a translated message key", () => {
    const issues = (input: Record<string, string>) => {
      const result = offerSchema.safeParse({ ...base, ...input });
      return result.success ? [] : result.error.issues.map((i) => i.message);
    };
    expect(issues({ discountValue: "150" })).toEqual(["percentRange"]);
    expect(issues({ discountValue: "12.5" })).toEqual(["percentRange"]);
    expect(issues({ discountType: "amount", discountValue: "0.5" })).toEqual(["amountRange"]);
    expect(issues({ discountType: "amount", discountValue: "1.234" })).toEqual(["amountRange"]);
    expect(issues({ validDays: "0" })).toEqual(["daysRange"]);
    expect(issues({ usageLimit: "2.5" })).toEqual(["limitRange"]);
    expect(issues({ noteAr: "x".repeat(121) })).toEqual(["tooLong"]);
  });
});

describe("coupon codes", () => {
  it("are shown in two groups of four", () => {
    expect(formatCode("ABCD2345")).toBe("ABCD-2345");
  });

  it("accept what staff type: any case, dashes, spaces", () => {
    expect(couponCodeSchema.parse(" abcd-2345 ")).toBe("ABCD2345");
    expect(couponCodeSchema.safeParse("ABC").success).toBe(false);
  });

  it("describe the discount in each language with Western digits", () => {
    expect(discountAmount("en", "percent", 15)).toBe("\u206615%\u2069");
    expect(discountAmount("ar", "percent", 15)).toBe("\u206615%\u2069");
    expect(discountAmount("en", "amount", 2000)).toBe("SAR 20");
    expect(discountAmount("ar", "amount", 1999)).toBe("19.99 ر.س");
  });
});
