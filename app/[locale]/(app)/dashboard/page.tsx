import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile } from "@/lib/auth/session";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { captureServerEvent } from "@/lib/observability/analytics";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("metaTitle") };
}

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const locale = await resolveLocale(params);
  const { user, membership } = await requireMembership(locale);
  const profile = await getProfile(user.id);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  captureServerEvent("dashboard_viewed", user.id, { locale, organization_id: membership.organization.id });
  const name = profile?.full_name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{name ? t("welcome", { name }) : t("welcomeNoName")}</h1>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{t("readyTitle", { organization: membership.organization.name })}</h2>
          <p className="text-muted-foreground">{t("readyBody")}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/locations">{t("manageLocations")}</Link>
            </Button>
            {can(membership.role, "members.manage") && (
              <Button asChild variant="outline">
                <Link href="/team">{t("inviteTeam")}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
