"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, getProfile } from "@/lib/auth/session";
import { buildInvitationEmail } from "@/lib/email/invitation-email";
import { getEmailProvider } from "@/lib/email/provider";
import { publicEnv } from "@/lib/env/public";
import { fieldErrorsFrom, text, type ErrorKey, type FormState } from "@/lib/forms";
import { getPathname } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { reportError } from "@/lib/observability/errors";
import { getActiveMembership, setActiveOrganizationCookie } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { inviteSchema, roleSchema } from "./schemas";
import { hashInvitationToken, newInvitationToken } from "./tokens";

export type InviteField = "email" | "role";

const id = z.uuid();

async function requireAdmin(locale: Locale) {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, "members.manage")) return null;
  return { user, membership };
}

export async function inviteMember(locale: Locale, _prev: FormState<InviteField>, formData: FormData): Promise<FormState<InviteField>> {
  const auth = await requireAdmin(locale);
  if (!auth) return { status: "error", formError: "forbidden" };

  const raw = { email: text(formData, "email"), role: text(formData, "role") };
  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };

  const token = newInvitationToken();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_invitation", {
    p_organization_id: auth.membership.organization.id,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_token_hash: hashInvitationToken(token),
  });
  if (error) return { status: "error", formError: dbErrorKey(error), values: raw };

  const profile = await getProfile(auth.user.id);
  try {
    await getEmailProvider().send(
      await buildInvitationEmail({
        locale,
        to: parsed.data.email,
        url: new URL(getPathname({ locale, href: `/invite/${token}` }), publicEnv.NEXT_PUBLIC_SITE_URL).toString(),
        organization: auth.membership.organization.name,
        inviter: profile?.full_name || auth.user.email || auth.membership.organization.name,
        role: parsed.data.role,
      }),
    );
  } catch (sendError) {
    reportError(sendError, { area: "team", action: "invite-email" });
    return { status: "error", formError: "generic", values: raw };
  }

  refresh();
  return { status: "success", values: { email: parsed.data.email } };
}

export async function revokeInvitation(locale: Locale, invitationId: string): Promise<ErrorKey | null> {
  if (!(await requireAdmin(locale))) return "forbidden";
  if (!id.safeParse(invitationId).success) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_invitation", { p_invitation_id: invitationId });
  if (error) return dbErrorKey(error);
  refresh();
  return null;
}

export async function changeMemberRole(locale: Locale, memberId: string, role: string): Promise<ErrorKey | null> {
  if (!(await requireAdmin(locale))) return "forbidden";
  const parsedRole = roleSchema.safeParse(role);
  if (!id.safeParse(memberId).success || !parsedRole.success) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("change_member_role", { p_member_id: memberId, p_role: parsedRole.data });
  if (error) return dbErrorKey(error);
  refresh();
  return null;
}

export async function removeMember(locale: Locale, memberId: string): Promise<ErrorKey | null> {
  if (!(await requireAdmin(locale))) return "forbidden";
  if (!id.safeParse(memberId).success) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("remove_member", { p_member_id: memberId });
  if (error) return dbErrorKey(error);
  refresh();
  return null;
}

export async function leaveOrganization(locale: Locale): Promise<ErrorKey | null> {
  await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("leave_organization", { p_organization_id: membership.organization.id });
  if (error) return dbErrorKey(error);
  redirect(getPathname({ locale, href: "/dashboard" }));
}

export async function acceptInvitation(locale: Locale, token: string): Promise<ErrorKey | null> {
  await requireUser(locale);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { data: organizationId, error } = await supabase.rpc("accept_invitation", { p_token_hash: hashInvitationToken(token) });
  if (error || !organizationId) return dbErrorKey(error);
  await setActiveOrganizationCookie(organizationId);
  redirect(getPathname({ locale, href: "/dashboard" }));
}
