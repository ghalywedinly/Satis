import { getTranslations } from "next-intl/server";
import { SatisLogo } from "@/components/brand/satis-mark";
import { Link } from "@/lib/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-6 px-6">
      <SatisLogo size={28} tone="ink-ultra" />
      <h1 className="text-4xl font-extrabold">{t("errors.notFound.title")}</h1>
      <p className="text-muted-foreground">{t("errors.notFound.body")}</p>
      <Link href="/" className="font-semibold text-ultramarine underline-offset-4 hover:underline">
        {t("common.actions.backHome")}
      </Link>
    </main>
  );
}
