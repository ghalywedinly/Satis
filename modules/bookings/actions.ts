"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsFrom, text, type ErrorKey, type FormState, type ValidationKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BOOKING_STATUSES, type BookingStatus } from "./definition";
import { isPlatformAdmin } from "./queries";

const id = z.uuid();
const msg = (key: ValidationKey) => key;

const detailsSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
  meetingLink: z
    .string()
    .trim()
    .max(500, msg("tooLong"))
    .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), msg("meetingLink")),
  notes: z.string().trim().max(2000, msg("tooLong")),
});

export type BookingField = "status" | "meetingLink" | "notes";

async function authorize(locale: Locale) {
  await requireUser(locale);
  return isPlatformAdmin();
}

/** Saves a booking's status, meeting link and notes (Satis team only; the database checks too). */
export async function saveBooking(locale: Locale, bookingId: string, _prev: FormState<BookingField>, formData: FormData): Promise<FormState<BookingField>> {
  const raw = { status: text(formData, "status"), meetingLink: text(formData, "meetingLink"), notes: text(formData, "notes") };
  const values = { meetingLink: raw.meetingLink, notes: raw.notes };
  const parsed = detailsSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  if (!(await authorize(locale)) || !id.safeParse(bookingId).success) return { status: "error", formError: "forbidden", values };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meeting_requests")
    .update({ status: parsed.data.status, meeting_link: parsed.data.meetingLink || null, notes: parsed.data.notes || null })
    .eq("id", bookingId)
    .select("id");
  if (error || !data?.length) return { status: "error", formError: error ? dbErrorKey(error) : "notFoundItem", values };
  refresh();
  return { status: "success", values };
}

/** Moves a booking along the pipeline (confirm, mark held, cancel…). */
export async function setBookingStatus(locale: Locale, bookingId: string, status: BookingStatus): Promise<ErrorKey | null> {
  if (!(await authorize(locale))) return "forbidden";
  if (!id.safeParse(bookingId).success || !BOOKING_STATUSES.includes(status)) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("meeting_requests").update({ status }).eq("id", bookingId).select("id");
  if (error || !data?.length) return error ? dbErrorKey(error) : "notFoundItem";
  refresh();
  return null;
}
