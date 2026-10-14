import { z } from "zod";
import type { BusinessType } from "@/types/database";

export const BUSINESS_TYPES: BusinessType[] = [
  "restaurant", "cafe", "retail", "clinic", "beauty", "hotel", "gym", "entertainment", "other",
];

const name = z.string().trim().min(1, "required").max(120, "tooLong");

export const createOrganizationSchema = z.object({
  name,
  businessType: z.enum(BUSINESS_TYPES, "required"),
  locationName: name,
  locationCity: z.string().trim().max(80, "tooLong"),
});

export const updateOrganizationSchema = z.object({
  name,
  businessType: z.enum(BUSINESS_TYPES, "required"),
  defaultLocale: z.enum(["ar", "en"], "required"),
});
