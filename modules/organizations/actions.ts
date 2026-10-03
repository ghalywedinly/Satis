"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsFrom, text, type FormState } from "@/lib/forms";
import { getPathname } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
import { reportError } from "@/lib/observability/errors";
import { getActiveMembership, getMemberships, setActiveOrganizationCookie } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrganizationSchema, updateOrganizationSchema } from "./schemas";

export type CreateOrganizationField = "name" | "businessType" | "locationName" | "locationCity";
export type UpdateOrganizationField = "name" | "businessType" | "defaultLocale";

/** Onboarding: creates the business (caller becomes owner) with its first location. */
export async function createOrganization(
  locale: Locale,
  _prev: FormState<CreateOrganizationField>,
  formData: FormData,
): Promise<FormState<CreateOrganizationField>> {
  const user = await requireUser(locale);
  const raw = {
    name: text(formData, "name"),
    businessType: text(formData, "businessType"),
    locationName: text(formData, "locationName"),
    locationCity: text(formData, "locationCity"),
  };
  const parsed = createOrganizationSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };

  const supabase = await createSupabaseServerClient();
  const { data: organizationId, error } = await supabase.rpc("create_organization", {
    p_name: parsed.data.name,
    p_business_type: parsed.data.businessType,
    // Customers see surveys in the language the owner set the business up in, until changed in settings.
    p_default_locale: locale,
    p_location_name: parsed.data.locationName,
    p_location_city: parsed.data.locationCity || null,
  });
  if (error || !organizationId) {
    const key = dbErrorKey(error);
    if (key === "generic") reportError(error, { area: "organizations", action: "create" });
    return { status: "error", formError: key, values: raw };
  }

  await setActiveOrganizationCookie(organizationId);
  captureServerEvent("organization_created", user.id, { business_type: parsed.data.businessType, organization_id: organizationId });
  captureServerEvent("location_created", user.id, { organization_id: organizationId, source: "onboarding" });
  // Onboarding continues with the first survey (steps 5–7); completion is tracked at the end.
  redirect(getPathname({ locale, href: "/onboarding/survey" }));
}

/** Switches the business the user is working in (only to one they belong to). */
export async function switchOrganization(organizationId: string) {
  const memberships = await getMemberships();
  if (!memberships.some((m) => m.organization.id === organizationId)) return;
  await setActiveOrganizationCookie(organizationId);
  refresh();
}

export async function updateOrganization(
  locale: Locale,
  _prev: FormState<UpdateOrganizationField>,
  formData: FormData,
): Promise<FormState<UpdateOrganizationField>> {
  await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, "organization.edit")) return { status: "error", formError: "forbidden" };

  const raw = {
    name: text(formData, "name"),
    businessType: text(formData, "businessType"),
    defaultLocale: text(formData, "defaultLocale"),
  };
  const parsed = updateOrganizationSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .update({ name: parsed.data.name, business_type: parsed.data.businessType, default_locale: parsed.data.defaultLocale })
    .eq("id", membership.organization.id)
    .select("id");
  // RLS silently filters rows the user may not update, so "no rows" means not allowed.
  if (error || !data?.length) return { status: "error", formError: error ? dbErrorKey(error) : "forbidden", values: raw };

  refresh();
  return { status: "success", values: raw };
}
