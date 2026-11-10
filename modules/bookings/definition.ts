import { googleCalendarUrl, MEETING_MINUTES } from "@/modules/meetings/slots";

/**
 * Bookings as the Satis team manages them: a small sales pipeline from a booked demo call to a
 * customer. Shared by the server and the admin pages. Cancelled bookings free their time slot.
 */
export const BOOKING_STATUSES = ["new", "confirmed", "held", "customer", "not_now", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
/** The pipeline board's columns, left to right (cancelled bookings aren't shown there). */
export const PIPELINE: Exclude<BookingStatus, "cancelled">[] = ["new", "confirmed", "held", "customer", "not_now"];

export type Booking = {
  id: string;
  starts_at: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  locale: "ar" | "en";
  created_at: string;
  status: BookingStatus;
  meeting_link: string | null;
  notes: string | null;
};

export { MEETING_MINUTES };

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The Sunday that starts the Saudi working week containing `date`, as "YYYY-MM-DD". */
export function weekStart(date: Date): string {
  const local = new Date(date.getTime() + RIYADH_OFFSET_MS);
  const sunday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - local.getUTCDay() * DAY_MS;
  return new Date(sunday).toISOString().slice(0, 10);
}

/** Midnight in Riyadh at the start of the given "YYYY-MM-DD", as a UTC instant. */
export const riyadhMidnight = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) - RIYADH_OFFSET_MS);

/** "YYYY-MM-DD" `days` after `day`. */
export const addDays = (day: string, days: number) => new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Where a booking sits in the week grid: day 0–4 (Sun–Thu) and its half-hour slot from 10:00. */
export function gridPosition(startsAt: string): { day: number; slot: number } {
  const local = new Date(new Date(startsAt).getTime() + RIYADH_OFFSET_MS);
  return { day: local.getUTCDay(), slot: (local.getUTCHours() - 10) * 2 + (local.getUTCMinutes() >= 30 ? 1 : 0) };
}

/** Digits only, for wa.me links ("+966 55…" → "96655…"). */
export const whatsappNumber = (phone: string) => phone.replace(/\D/g, "");

export function whatsappLink(phone: string, text?: string) {
  const url = new URL(`https://wa.me/${whatsappNumber(phone)}`);
  if (text) url.searchParams.set("text", text);
  return url.toString();
}

export const calendarLink = (booking: Booking, title: string) =>
  googleCalendarUrl(booking.starts_at, title, [booking.full_name, booking.email, booking.phone, booking.meeting_link].filter(Boolean).join(" · "));

/** Upcoming means the call hasn't finished yet. */
export const isUpcoming = (booking: Booking, now: Date) => new Date(booking.starts_at).getTime() + MEETING_MINUTES * 60 * 1000 > now.getTime();
