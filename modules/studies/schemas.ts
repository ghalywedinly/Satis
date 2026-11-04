import { z } from "zod";
import type { ValidationKey } from "@/lib/forms";

const msg = (key: ValidationKey) => key;

export const studySchema = z.object({
  name: z.string().trim().min(1, msg("required")).max(120, msg("tooLong")),
  description: z.string().trim().max(1000, msg("tooLong")),
  matchParticipants: z.boolean(),
});

export const newStudySchema = studySchema.extend({ template: z.enum(["research", "satisfaction"]) });

export type StudyField = "name" | "description";
