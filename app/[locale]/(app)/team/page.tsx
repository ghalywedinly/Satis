import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InviteForm } from "@/modules/team/components/invite-form";
import { MemberList } from "@/modules/team/components/member-list";
import { PendingInvitations } from "@/modules/team/components/pending-invitations";

export async function generateMetadata({ params }: PageProps<"/[locale]/team">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "team" });
  return { title: t("metaTitle") };
}

export default async function TeamPage({ params }: PageProps<"/[locale]/team">) {
  const locale = await resolveLocale(params);
  const { user, membership } = await requireMembership(locale);
  const t = await getTranslations({ locale, namespace: "team" });
  const canManage = can(membership.role, "members.manage");
  const organizationId = membership.organization.id;

  const supabase = await createSupabaseServerClient();
  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase.rpc("list_organization_members", { p_organization_id: organizationId }),
    canManage
      ? supabase
          .from("organization_invitations")
          .select("id, email, role, expires_at")
          .eq("organization_id", organizationId)
          .is("accepted_at", null)
          .is("revoked_at", null)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-2xl flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted-foreground">{canManage ? t("subtitle") : t("readOnly")}</p>
      </div>
      {canManage && <InviteForm currentRole={membership.role} />}
      <MemberList
        currentUserId={user.id}
        currentRole={membership.role}
        members={(members ?? []).map((m) => ({
          memberId: m.member_id,
          userId: m.user_id,
          role: m.role,
          fullName: m.full_name,
          email: m.email,
        }))}
      />
      {canManage && (invitations?.length ?? 0) > 0 && (
        <PendingInvitations
          invitations={(invitations ?? []).map((i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expires_at }))}
        />
      )}
    </div>
  );
}
