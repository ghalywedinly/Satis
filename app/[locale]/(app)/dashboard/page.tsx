import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile, requireUser } from "@/lib/auth/session";
import { resolveLocale } from "@/lib/i18n/server";
import { captureServerEvent } from "@/lib/observability/analytics";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("metaTitle") };
}

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const locale = await resolveLocale(params);
  const user = await requireUser(locale);
  const profile = await getProfile(user.id);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  captureServerEvent("dashboard_viewed", user.id, { locale });
  const name = profile?.full_name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{name ? t("welcome", { name }) : t("welcomeNoName")}</h1>
      <Card>
        <CardContent className="text-muted-foreground">{t("setupNext")}</CardContent>
      </Card>
    </div>
  );
}
