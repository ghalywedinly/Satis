"use server";

import { after } from "next/server";
import { fieldErrorsFrom, text, type FormState } from "@/lib/forms";
import { routing, type Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
import { reportError } from "@/lib/observability/errors";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendBookingEmails } from "./emails";
import { bookingSchema, type BookingField } from "./schemas";
import { isOfferedSlot } from "./slots";

/**
 * Public: books a sales call from the website. The visitor's details go to a server-only table;
 * the database's unique slot is what prevents double booking when two people pick the same time.
 */
export async function bookMeeting(locale: Locale, _prev: FormState<BookingField>, formData: FormData): Promise<FormState<BookingField>> {
  const lang = routing.locales.includes(locale) ? locale : routing.defaultLocale;
  const raw = {
    startsAt: text(formData, "startsAt"),
    fullName: text(formData, "fullName"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    company: text(formData, "company"),
  };
  const values = raw;
  // Honeypot: a hidden field people never fill in. Pretend it worked, store nothing.
  if (text(formData, "website") !== "") return { status: "success", values };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  const booking = parsed.data;
  if (!isOfferedSlot(booking.startsAt, new Date())) return { status: "error", formError: "slotTaken", values };

  if (!(await consumeRateLimit("meetingBooking", await clientIp()))) return { status: "error", formError: "rateLimited", values };

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    reportError(new Error("Booking needs SUPABASE_SECRET_KEY"), { area: "meetings" });
    return { status: "error", formError: "generic", values };
  }
  const startsAt = new Date(booking.startsAt).toISOString();
  const { data, error } = await supabase
    .from("meeting_requests")
    .insert({ starts_at: startsAt, full_name: booking.fullName, email: booking.email, phone: booking.phone, company: booking.company, locale: lang })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { status: "error", formError: "slotTaken", values };
    reportError(error, { area: "meetings", action: "book" });
    return { status: "error", formError: "generic", values };
  }

  captureServerEvent("meeting_booked", data.id, { locale: lang });
  after(() => sendBookingEmails({ ...booking, startsAt, locale: lang }));
  return { status: "success", values: { ...values, startsAt } };
}
