import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FormAlert } from "@/components/forms/form-alert";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { LoginForm } from "@/modules/auth/components/login-form";

const NOTICES = ["linkInvalid", "sessionExpired"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "auth.login" });
  return { title: t("metaTitle") };
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "auth.login" });
  const te = await getTranslations({ locale, namespace: "errors" });
  const { next, error } = await searchParams;
  const notice = NOTICES.find((n) => n === error);

  return (
    <AuthCard
      title={t("title")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/signup" className="font-semibold text-ultramarine hover:underline">
            {t("createAccount")}
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {notice && <FormAlert tone="error">{te(notice)}</FormAlert>}
        <LoginForm next={typeof next === "string" ? next : undefined} />
      </div>
    </AuthCard>
  );
}
