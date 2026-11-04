import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { StudyForm } from "@/modules/studies/components/study-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/studies/new">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "studies.new" });
  return { title: t("metaTitle") };
}

export default async function NewStudyPage({ params }: PageProps<"/[locale]/studies/new">) {
  const locale = await resolveLocale(params);
  const { membership } = await requireMembership(locale);
  if (!can(membership.role, "surveys.manage")) redirect({ href: "/studies", locale });
  const t = await getTranslations({ locale, namespace: "studies" });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/studies" className="flex items-center gap-1 self-start rounded-control text-sm font-semibold text-muted-foreground outline-none hover:text-ink focus-visible:shadow-focus">
        <ChevronLeft aria-hidden strokeWidth={1.75} className="size-4 rtl:-scale-x-100" />
        {t("backToStudies")}
      </Link>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold">{t("new.title")}</h1>
        <p className="text-muted-foreground">{t("new.body")}</p>
      </div>
      <div className="rounded-card border border-border bg-white p-5 sm:p-7">
        <StudyForm mode="create" />
      </div>
    </div>
  );
}
