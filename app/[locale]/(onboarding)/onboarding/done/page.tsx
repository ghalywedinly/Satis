import type { Metadata } from "next";
import { CreditCard, LogOut, UtensilsCrossed } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { captureServerEvent } from "@/lib/observability/analytics";
import { requireMembership } from "@/lib/org/context";
import { OnboardingProgress, ONBOARDING_STEPS } from "@/modules/organizations/components/onboarding-progress";

export async function generateMetadata({ params }: PageProps<"/[locale]/onboarding/done">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return { title: t("done.title") };
}

/** Onboarding step 7: where to put the QR code. */
export default async function OnboardingDonePage({ params }: PageProps<"/[locale]/onboarding/done">) {
  const locale = await resolveLocale(params);
  const { user, membership } = await requireMembership(locale);
  const t = await getTranslations({ locale, namespace: "onboarding" });
  captureServerEvent("onboarding_completed", user.id, { organization_id: membership.organization.id });
  const tips = [
    { icon: CreditCard, text: t("done.tips.counter") },
    { icon: UtensilsCrossed, text: t("done.tips.tables") },
    { icon: LogOut, text: t("done.tips.exit") },
  ];

  return (
    <div className="flex flex-col gap-8">
      <OnboardingProgress current={7} label={t("progress", { current: formatCount(locale, 7), total: formatCount(locale, ONBOARDING_STEPS) })} />
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] leading-tight font-extrabold sm:text-4xl">{t("done.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("done.body")}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {tips.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 rounded-tile border border-border bg-white p-4">
            <Icon aria-hidden strokeWidth={1.75} className="size-5 shrink-0 text-ultramarine rtl:-scale-x-100" />
            <span className="font-medium">{text}</span>
          </li>
        ))}
      </ul>
      <Button asChild size="lg" className="self-end">
        <Link href="/dashboard">{t("done.finish")}</Link>
      </Button>
    </div>
  );
}
