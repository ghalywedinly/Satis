"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsFrom, text, type ErrorKey, type FormState } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
import { getActiveMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { locationSchema } from "./schemas";

export type LocationField = "name" | "city" | "address";

const id = z.uuid();

async function authorize(locale: Locale) {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, "locations.manage")) return null;
  return { user, organizationId: membership.organization.id };
}

/** Creates a location, or updates one when the form includes `locationId`. */
export async function saveLocation(
  locale: Locale,
  _prev: FormState<LocationField>,
  formData: FormData,
): Promise<FormState<LocationField>> {
  const auth = await authorize(locale);
  if (!auth) return { status: "error", formError: "forbidden" };

  const raw = { name: text(formData, "name"), city: text(formData, "city"), address: text(formData, "address") };
  const parsed = locationSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };
  const values = { name: parsed.data.name, city: parsed.data.city || null, address: parsed.data.address || null };

  const supabase = await createSupabaseServerClient();
  const locationId = text(formData, "locationId");
  if (locationId) {
    if (!id.safeParse(locationId).success) return { status: "error", formError: "notFoundItem" };
    const { data, error } = await supabase
      .from("locations")
      .update(values)
      .eq("id", locationId)
      .eq("organization_id", auth.organizationId)
      .select("id");
    if (error || !data?.length) return { status: "error", formError: error ? dbErrorKey(error) : "notFoundItem", values: raw };
  } else {
    const { error } = await supabase.from("locations").insert({ ...values, organization_id: auth.organizationId });
    if (error) return { status: "error", formError: dbErrorKey(error), values: raw };
    captureServerEvent("location_created", auth.user.id, { organization_id: auth.organizationId, source: "locations" });
  }

  refresh();
  return { status: "success" };
}

export async function setLocationArchived(locale: Locale, locationId: string, archived: boolean): Promise<ErrorKey | null> {
  const auth = await authorize(locale);
  if (!auth) return "forbidden";
  if (!id.safeParse(locationId).success) return "notFoundItem";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", locationId)
    .eq("organization_id", auth.organizationId)
    .select("id");
  if (error || !data?.length) return error ? dbErrorKey(error) : "notFoundItem";
  refresh();
  return null;
}
