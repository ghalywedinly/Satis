import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { redirect } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessType, OrgRole } from "@/types/database";

/** Which business the user is working in. Always re-checked against their memberships. */
export const ACTIVE_ORG_COOKIE = "satis_org";

export type Membership = {
  role: OrgRole;
  organization: { id: string; name: string; business_type: BusinessType; default_locale: "ar" | "en" };
};

export const getMemberships = cache(async (): Promise<Membership[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id, name, business_type, default_locale)")
    .eq("user_id", user.id);
  return (data ?? [])
    .filter((m): m is Membership => m.organization !== null)
    .sort((a, b) => a.organization.name.localeCompare(b.organization.name));
});

export const getActiveMembership = cache(async (): Promise<Membership | null> => {
  const memberships = await getMemberships();
  if (memberships.length === 0) return null;
  const selected = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  return memberships.find((m) => m.organization.id === selected) ?? memberships[0];
});

/** For pages inside a business: the signed-in user and their active membership, or onboarding. */
export async function requireMembership(locale: Locale) {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership) return redirect({ href: "/onboarding", locale });
  return { user, membership };
}

export async function setActiveOrganizationCookie(organizationId: string) {
  (await cookies()).set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
