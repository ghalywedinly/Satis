import { z } from "zod";

export const locationSchema = z.object({
  name: z.string().trim().min(1, "required").max(120, "tooLong"),
  city: z.string().trim().max(80, "tooLong"),
  address: z.string().trim().max(200, "tooLong"),
});
