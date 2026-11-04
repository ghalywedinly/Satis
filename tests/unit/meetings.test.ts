import { describe, expect, it } from "vitest";
import { bookingSchema, normalizePhone } from "@/modules/meetings/schemas";
import { bookingDays, bookingWindow, googleCalendarUrl, isOfferedSlot, riyadhDate } from "@/modules/meetings/slots";

// Wednesday 14 October 2026, 08:00 in Riyadh.
const now = new Date("2026-10-14T05:00:00Z");

describe("bookingDays", () => {
  const days = bookingDays(now);

  it("offers ten working days, Sunday to Thursday", () => {
    expect(days).toHaveLength(10);
    const weekdays = days.map((d) => new Date(`${d.date}T12:00:00Z`).getUTCDay());
    expect(weekdays.every((w) => w <= 4)).toBe(true);
    expect(days.map((d) => d.date).slice(0, 3)).toEqual(["2026-10-14", "2026-10-15", "2026-10-18"]);
  });

  it("offers half-hour calls from 10:00 to 17:00 Saudi time, at least three hours ahead", () => {
    const tomorrow = days[1]!;
    expect(tomorrow.slots).toHaveLength(14);
    expect(tomorrow.slots[0]).toBe("2026-10-15T07:00:00.000Z");
    expect(tomorrow.slots.at(-1)).toBe("2026-10-15T13:30:00.000Z");
    // Today at 08:00: the first time is 11:00 (three hours' notice).
    expect(days[0]!.slots[0]).toBe("2026-10-14T08:00:00.000Z");
  });

  it("skips today once its last time has passed", () => {
    const evening = bookingDays(new Date("2026-10-14T14:00:00Z"));
    expect(evening[0]!.date).toBe("2026-10-15");
  });

  it("covers its days in one window", () => {
    expect(bookingWindow(days)).toEqual({ from: "2026-10-14T08:00:00.000Z", to: "2026-10-27T14:00:00.000Z" });
    expect(bookingWindow([])).toBeNull();
  });
});

describe("isOfferedSlot", () => {
  it("accepts offered times in any offset and rejects others", () => {
    expect(isOfferedSlot("2026-10-15T10:00:00+03:00", now)).toBe(true);
    expect(isOfferedSlot("2026-10-15T10:15:00+03:00", now)).toBe(false);
    expect(isOfferedSlot("2026-10-16T10:00:00+03:00", now)).toBe(false); // Friday
    expect(isOfferedSlot("2026-10-14T09:00:00+03:00", now)).toBe(false); // too soon
    expect(isOfferedSlot("not a date", now)).toBe(false);
  });
});

describe("riyadhDate and googleCalendarUrl", () => {
  it("uses Saudi dates and a 30-minute event", () => {
    expect(riyadhDate(new Date("2026-10-14T22:00:00Z"))).toBe("2026-10-15");
    const url = new URL(googleCalendarUrl("2026-10-15T07:00:00.000Z", "Satis meeting", "Call"));
    expect(url.searchParams.get("dates")).toBe("20261015T070000Z/20261015T073000Z");
  });
});

describe("normalizePhone", () => {
  it.each([
    ["0551234567", "+966551234567"],
    ["055 123 4567", "+966551234567"],
    ["551234567", "+966551234567"],
    ["+966 55 123 4567", "+966551234567"],
    ["00966551234567", "+966551234567"],
    ["٠٥٥١٢٣٤٥٦٧", "+966551234567"],
    ["+971 50 123 4567", "+971501234567"],
  ])("%s → %s", (input, expected) => expect(normalizePhone(input)).toBe(expected));

  it.each(["12345", "0112345678", "+966112345678", "phone", "+1 (312) 847-1928 ext 4"])("rejects %s", (input) => expect(normalizePhone(input)).toBeNull());
});

describe("bookingSchema", () => {
  const valid = { startsAt: "2026-10-15T07:00:00.000Z", fullName: "Rakan Alotaibi", email: "Rakan@Example.com", phone: "0551234567", company: "Qahwa House" };

  it("normalizes a valid booking", () => {
    expect(bookingSchema.parse(valid)).toEqual({ ...valid, email: "rakan@example.com", phone: "+966551234567" });
  });

  it("returns translation keys for each problem", () => {
    const result = bookingSchema.safeParse({ startsAt: "", fullName: " ", email: "nope", phone: "123", company: "" });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(result.error!.issues.map((i) => [i.path[0], i.message]));
    expect(messages).toEqual({ startsAt: "pickTime", fullName: "required", email: "email", phone: "phone", company: "required" });
  });
});
