import { z } from "zod";
import { ROLES } from "@/lib/permissions";
import { emailSchema } from "@/modules/auth/schemas";

export const roleSchema = z.enum(ROLES, "required");

export const inviteSchema = z.object({
  email: emailSchema,
  role: roleSchema.refine((r) => r !== "owner", "required"),
});
