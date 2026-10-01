import "server-only";
import { randomInt } from "node:crypto";
import { publicEnv } from "@/lib/env/public";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

// No 0/O, 1/l/I: codes may be typed from a printed card.
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export const newPublicCode = () => Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

/** The public survey URL encoded in QR codes. */
export const surveyUrl = (code: string) =>
  new URL(`/s/${code}`, process.env.NEXT_PUBLIC_SURVEY_BASE_URL || publicEnv.NEXT_PUBLIC_SITE_URL).toString();

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Gives every active location of the business a QR link for the survey. Returns how many were created. */
export async function ensureLinks(supabase: Supabase, organizationId: string, surveyId: string): Promise<number> {
  const [{ data: locations }, { data: links }] = await Promise.all([
    supabase.from("locations").select("id").eq("organization_id", organizationId).is("archived_at", null),
    supabase.from("survey_links").select("location_id").eq("survey_id", surveyId),
  ]);
  const linked = new Set((links ?? []).map((l) => l.location_id));
  const missing = (locations ?? []).filter((l) => !linked.has(l.id));
  if (missing.length === 0) return 0;

  const rows = () => missing.map((l) => ({ organization_id: organizationId, survey_id: surveyId, location_id: l.id, public_code: newPublicCode() }));
  let { error } = await supabase.from("survey_links").insert(rows());
  // A random-code collision is astronomically unlikely; retry once with fresh codes.
  if (error?.code === "23505") ({ error } = await supabase.from("survey_links").insert(rows()));
  if (error) throw error;
  return missing.length;
}
