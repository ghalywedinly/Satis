import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/lib/i18n/server";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { ResendVerification } from "@/modules/auth/components/resend-verification";
import { getPendingEmail } from "@/modules/auth/pending-email";

export async function generateMetadata({ params }: PageProps<"/[locale]/verify-email">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "auth.verify" });
  return { title: t("metaTitle") };
}

export default async function VerifyEmailPage({ params }: PageProps<"/[locale]/verify-email">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "auth.verify" });
  const email = await getPendingEmail();

  return (
    <AuthCard
      title={t("title")}
      subtitle={
        email
          ? t.rich("body", {
              address: email,
              email: (chunks) => (
                <bdi dir="ltr" className="font-semibold text-ink">
                  {chunks}
                </bdi>
              ),
            })
          : t("bodyNoEmail")
      }
    >
      {email && <ResendVerification />}
    </AuthCard>
  );
}
