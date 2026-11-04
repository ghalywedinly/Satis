import type { z } from "zod";
import type { Messages } from "@/locales";

/** Validation messages are translation keys under `validation.*`, translated where they're shown. */
export type ValidationKey = keyof Messages["validation"];

/** Form-level errors are translation keys under `errors.*` (string messages only). */
export type ErrorKey = {
  [K in keyof Messages["errors"]]: Messages["errors"][K] extends string ? K : never;
}[keyof Messages["errors"]];

export type FormState<Field extends string> = {
  status: "idle" | "error" | "success";
  fieldErrors?: Partial<Record<Field, ValidationKey>>;
  formError?: ErrorKey;
  /** Non-secret values echoed back so the form keeps them after a failed submit. */
  values?: Partial<Record<Field, string>>;
};

export const idle = { status: "idle" } as const;

export function fieldErrorsFrom<Field extends string>(error: z.ZodError): Partial<Record<Field, ValidationKey>> {
  const out: Partial<Record<Field, ValidationKey>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as Field;
    if (field && !out[field]) out[field] = issue.message as ValidationKey;
  }
  return out;
}

export const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};
