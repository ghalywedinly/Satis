import { z } from "zod";

/** Accepts Arabic-Indic and Persian digits as typed on Arabic keyboards. */
export const toWesternDigits = (value: string) =>
  value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace("٫", ".");

const number = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? Number(toWesternDigits(v.trim())) : NaN);
const optionalUuid = z.union([z.literal(""), z.uuid()]);

export const offerSchema = z
  .object({
    surveyId: z.uuid("required"),
    locationId: optionalUuid,
    discountType: z.enum(["percent", "amount"]),
    discountValue: z.preprocess(number, z.number()),
    validDays: z.preprocess(number, z.number().int("daysRange").min(1, "daysRange").max(365, "daysRange")),
    usageLimit: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : number(v)),
      z.number().int("limitRange").min(1, "limitRange").max(1_000_000, "limitRange").nullable(),
    ),
    noteAr: z.string().trim().max(120, "tooLong"),
    noteEn: z.string().trim().max(120, "tooLong"),
  })
  .superRefine((offer, ctx) => {
    const v = offer.discountValue;
    if (offer.discountType === "percent" && !(Number.isInteger(v) && v >= 1 && v <= 100)) {
      ctx.addIssue({ code: "custom", path: ["discountValue"], message: "percentRange" });
    }
    if (offer.discountType === "amount" && !(Number.isFinite(v) && v >= 1 && v <= 10_000 && Math.abs(Math.round(v * 100) - v * 100) < 1e-6)) {
      ctx.addIssue({ code: "custom", path: ["discountValue"], message: "amountRange" });
    }
  })
  // Amounts are stored in halalas.
  .transform((offer) => ({
    ...offer,
    discountValue: offer.discountType === "amount" ? Math.round(offer.discountValue * 100) : offer.discountValue,
    locationId: offer.locationId || null,
  }));

/** What staff type: letters and digits, any case, dashes and spaces allowed. */
export const couponCodeSchema = z
  .string()
  .transform((v) => toWesternDigits(v).replace(/[^A-Za-z0-9]/g, "").toUpperCase())
  .pipe(z.string().length(8));
