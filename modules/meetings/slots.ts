/**
 * Meeting times offered on the booking page: 30-minute calls, Sunday to Thursday, 10:00 to 17:00
 * Saudi time, at least a few hours ahead. Used by the page to draw the calendar and by the server
 * to reject any time the page would not have offered.
 */
export const MEETING_MINUTES = 30;
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000; // Saudi Arabia has no daylight saving.
const FIRST_HOUR = 10;
const LAST_HOUR = 17; // the last call ends at 17:00
const WORK_DAYS = new Set([0, 1, 2, 3, 4]); // Sunday to Thursday
const MIN_NOTICE_MS = 3 * 60 * 60 * 1000;
export const BOOKING_DAYS = 10;

export type BookingDay = { date: string; slots: string[] };

/** The next working days that still have open times, each with its slot start times (ISO, UTC). */
export function bookingDays(now: Date, count = BOOKING_DAYS): BookingDay[] {
  const earliest = now.getTime() + MIN_NOTICE_MS;
  // Midnight today in Riyadh, expressed as a UTC instant.
  const local = new Date(now.getTime() + RIYADH_OFFSET_MS);
  let dayStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - RIYADH_OFFSET_MS;
  const days: BookingDay[] = [];
  // Bounded loop: count working days fit in well under 3 × count calendar days.
  for (let i = 0; days.length < count && i < count * 3; i++, dayStart += 24 * 60 * 60 * 1000) {
    const date = new Date(dayStart + RIYADH_OFFSET_MS);
    if (!WORK_DAYS.has(date.getUTCDay())) continue;
    const slots: string[] = [];
    for (let minutes = FIRST_HOUR * 60; minutes + MEETING_MINUTES <= LAST_HOUR * 60; minutes += MEETING_MINUTES) {
      const start = dayStart + minutes * 60 * 1000;
      if (start >= earliest) slots.push(new Date(start).toISOString());
    }
    if (slots.length > 0) days.push({ date: date.toISOString().slice(0, 10), slots });
  }
  return days;
}

/** Today's date in Saudi time, "YYYY-MM-DD". */
export const riyadhDate = (now: Date) => new Date(now.getTime() + RIYADH_OFFSET_MS).toISOString().slice(0, 10);

/** The range the booking page covers, for reading which times are already taken. */
export function bookingWindow(days: BookingDay[]): { from: string; to: string } | null {
  const first = days[0]?.slots[0];
  const last = days.at(-1)?.slots.at(-1);
  if (!first || !last) return null;
  return { from: first, to: new Date(new Date(last).getTime() + MEETING_MINUTES * 60 * 1000).toISOString() };
}

/** Whether `iso` is a time the booking page offers right now. */
export function isOfferedSlot(iso: string, now: Date): boolean {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return false;
  return bookingDays(now).some((day) => day.slots.some((slot) => new Date(slot).getTime() === time));
}

/** Google Calendar "add event" link for a booked call. */
export function googleCalendarUrl(startsAt: string, title: string, details: string): string {
  const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(startsAt).getTime();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(start)}/${stamp(start + MEETING_MINUTES * 60 * 1000)}`,
    details,
    ctz: "Asia/Riyadh",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
