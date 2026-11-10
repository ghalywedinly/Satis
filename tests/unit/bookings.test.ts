import { describe, expect, it } from "vitest";
import { addDays, gridPosition, riyadhMidnight, weekStart, whatsappLink, whatsappNumber } from "@/modules/bookings/definition";

describe("booking calendar", () => {
  it("starts weeks on Sunday, in Saudi time", () => {
    // Wednesday 18 November 2026, 23:30 in Riyadh (20:30 UTC).
    expect(weekStart(new Date("2026-11-18T20:30:00Z"))).toBe("2026-11-15");
    // Saturday 21 November 01:00 in Riyadh (Friday 22:00 UTC) still belongs to the week of the 15th.
    expect(weekStart(new Date("2026-11-20T22:00:00Z"))).toBe("2026-11-15");
    // Sunday 22 November 00:30 in Riyadh starts the next week.
    expect(weekStart(new Date("2026-11-21T21:30:00Z"))).toBe("2026-11-22");
  });

  it("places bookings on the day and half-hour row", () => {
    expect(gridPosition("2026-11-15T07:00:00Z")).toEqual({ day: 0, slot: 0 }); // Sunday 10:00
    expect(gridPosition("2026-11-18T13:30:00Z")).toEqual({ day: 3, slot: 13 }); // Wednesday 16:30
  });

  it("does date maths in Saudi days", () => {
    expect(addDays("2026-11-15", 7)).toBe("2026-11-22");
    expect(riyadhMidnight("2026-11-15").toISOString()).toBe("2026-11-14T21:00:00.000Z");
  });

  it("builds WhatsApp links from any phone format", () => {
    expect(whatsappNumber("+966 55 123 4567")).toBe("966551234567");
    expect(whatsappLink("+966551234567", "Hello Rakan")).toBe("https://wa.me/966551234567?text=Hello+Rakan");
  });
});
