import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "auth.forgot" });
  return { title: t("metaTitle") };
}

export default async function ForgotPasswordPage({ params }: PageProps<"/[locale]/forgot-password">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "auth.forgot" });
  return (
    <AuthCard
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <Link href="/login" className="font-semibold text-ultramarine hover:underline">
          {t("backToLogin")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
