import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { ResetPasswordForm } from "@/modules/auth/components/reset-password-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "auth.reset" });
  return { title: t("metaTitle") };
}

/** Reached from the password-reset email, which signs the user in through /auth/confirm. */
export default async function ResetPasswordPage({ params }: PageProps<"/[locale]/reset-password">) {
  const locale = await resolveLocale(params);
  if (!(await getCurrentUser())) redirect({ href: "/login?error=linkInvalid", locale });
  const t = await getTranslations({ locale, namespace: "auth.reset" });
  return (
    <AuthCard title={t("title")}>
      <ResetPasswordForm />
    </AuthCard>
  );
}
