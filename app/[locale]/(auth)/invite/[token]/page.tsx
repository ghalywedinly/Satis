import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getPathname, Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { AcceptInvitation } from "@/modules/team/components/accept-invitation";
import { hashInvitationToken } from "@/modules/team/tokens";

export async function generateMetadata({ params }: PageProps<"/[locale]/invite/[token]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "invite" });
  // Invitation links are private; keep them out of search engines and referrers.
  return { title: t("metaTitle"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

/** Landing page for team invitation links. Works signed out (asks to log in) and signed in. */
export default async function InvitePage({ params }: PageProps<"/[locale]/invite/[token]">) {
  const locale = await resolveLocale(params);
  const { token } = await params;
  const t = await getTranslations({ locale, namespace: "invite" });
  const tr = await getTranslations({ locale, namespace: "organization.roles" });
  const user = await getCurrentUser();

  if (!user) {
    const next = encodeURIComponent(getPathname({ locale, href: `/invite/${token}` }));
    return (
      <AuthCard title={t("metaTitle")} subtitle={t("signInPrompt")}>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={`/login?next=${next}`}>{t("logIn")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={`/signup?next=${next}`}>{t("signUp")}</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = /^[A-Za-z0-9_-]{43}$/.test(token)
    ? await supabase.rpc("get_invitation", { p_token_hash: hashInvitationToken(token) })
    : { data: null };
  const invitation = data?.[0];

  if (!invitation || invitation.status !== "pending") {
    return (
      <AuthCard title={invitation ? t("title", { organization: invitation.organization_name }) : t("metaTitle")}>
        <FormAlert tone="error">{invitation?.status === "email_mismatch" ? t("emailMismatch") : t("unavailable")}</FormAlert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("title", { organization: invitation.organization_name })}
      subtitle={t("body", { organization: invitation.organization_name, role: tr(invitation.role) })}
    >
      <AcceptInvitation token={token} />
    </AuthCard>
  );
}
