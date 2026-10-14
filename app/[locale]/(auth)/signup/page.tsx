import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { SignupForm } from "@/modules/auth/components/signup-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/signup">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "auth.signup" });
  return { title: t("metaTitle") };
}

export default async function SignupPage({ params, searchParams }: PageProps<"/[locale]/signup">) {
  const locale = await resolveLocale(params);
  const { next } = await searchParams;
  const t = await getTranslations({ locale, namespace: "auth.signup" });
  return (
    <AuthCard
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link
            href={typeof next === "string" ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-semibold text-ultramarine hover:underline"
          >
            {t("logIn")}
          </Link>
        </>
      }
    >
      <SignupForm next={typeof next === "string" ? next : undefined} />
    </AuthCard>
  );
}
