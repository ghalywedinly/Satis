import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { getMemberships } from "@/lib/org/context";
import { OnboardingWizard } from "@/modules/organizations/components/onboarding-wizard";

export async function generateMetadata({ params }: PageProps<"/[locale]/onboarding">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return { title: t("metaTitle") };
}

export default async function OnboardingPage({ params, searchParams }: PageProps<"/[locale]/onboarding">) {
  const locale = await resolveLocale(params);
  const { new: createAnother } = await searchParams;
  const memberships = await getMemberships();
  // People who already belong to a business only come here to create another one.
  if (memberships.length > 0 && createAnother !== "1") redirect({ href: "/dashboard", locale });
  return <OnboardingWizard skipWelcome={memberships.length > 0} />;
}
