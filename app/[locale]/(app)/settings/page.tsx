import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { OrganizationSettingsForm } from "@/modules/organizations/components/organization-settings-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "settings" });
  return { title: t("metaTitle") };
}

export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const locale = await resolveLocale(params);
  const { membership } = await requireMembership(locale);
  if (!can(membership.role, "organization.edit")) redirect({ href: "/dashboard", locale });
  const t = await getTranslations({ locale, namespace: "settings" });
  const org = membership.organization;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>
      <Card>
        <CardContent>
          <OrganizationSettingsForm
            organization={{ name: org.name, businessType: org.business_type, defaultLocale: org.default_locale }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
