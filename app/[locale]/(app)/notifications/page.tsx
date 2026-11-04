import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { NotificationPreferencesForm } from "@/modules/notifications/components/notification-preferences-form";
import { getNotificationPreferences } from "@/modules/notifications/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/notifications">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "notifications" });
  return { title: t("metaTitle") };
}

export default async function NotificationsPage({ params }: PageProps<"/[locale]/notifications">) {
  const locale = await resolveLocale(params);
  const { user, membership } = await requireMembership(locale);
  const [t, preferences] = await Promise.all([
    getTranslations({ locale, namespace: "notifications" }),
    getNotificationPreferences(membership.organization.id, user.id, membership.role),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle", { business: membership.organization.name })}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4">
          {user.email && (
            <p className="text-sm text-muted-foreground">
              {t.rich("emailTo", { address: user.email, email: (chunks) => <bdi dir="ltr">{chunks}</bdi> })}
            </p>
          )}
          <NotificationPreferencesForm initial={preferences} />
        </CardContent>
      </Card>
    </div>
  );
}
