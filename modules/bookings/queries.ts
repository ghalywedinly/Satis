import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { riyadhMidnight, type Booking } from "./definition";

const COLUMNS = "id, starts_at, full_name, email, phone, company, locale, created_at, status, meeting_link, notes";

/** Whether the signed-in person is on the Satis team. The database enforces it on every read. */
export const isPlatformAdmin = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return data === true;
});

/** Bookings starting in [from, to). */
export async function bookingsBetween(from: Date, to: Date): Promise<Booking[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("meeting_requests")
    .select(COLUMNS)
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");
  if (error) throw error;
  return data ?? [];
}

/** Bookings that still need something from the team: upcoming ones and recent ones, newest last. */
export async function activeBookings(now: Date): Promise<Booking[]> {
  return bookingsBetween(new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 62 * 24 * 60 * 60 * 1000));
}

export async function getBooking(id: string): Promise<Booking | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("meeting_requests").select(COLUMNS).eq("id", id).maybeSingle();
  return data;
}

/** The week's bookings, Sunday to Thursday (Saudi time). */
export const bookingsInWeek = (sunday: string) => bookingsBetween(riyadhMidnight(sunday), new Date(riyadhMidnight(sunday).getTime() + 5 * 24 * 60 * 60 * 1000));
