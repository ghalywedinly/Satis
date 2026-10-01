import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import type { SurveyRow } from "../queries";
import { SurveyStatusBadge } from "./survey-status-badge";
import { SurveyStatusControl } from "./survey-status-control";

export async function SurveyHeader({
  locale,
  survey,
  active,
  canManage,
}: {
  locale: Locale;
  survey: SurveyRow;
  active: "edit" | "share";
  canManage: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "surveys" });
  const tabs = [
    { key: "edit", href: `/surveys/${survey.id}`, label: t("tabs.edit") },
    { key: "share", href: `/surveys/${survey.id}/share`, label: t("tabs.share") },
  ] as const;

  return (
    <div className="flex flex-col gap-4 print:hidden">
      <Link href="/surveys" className="flex items-center gap-1 self-start rounded-control text-sm font-semibold text-muted-foreground outline-none hover:text-ink focus-visible:shadow-focus">
        <ChevronLeft aria-hidden strokeWidth={1.75} className="size-4 rtl:-scale-x-100" />
        {t("builder.backToSurveys")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="me-auto text-3xl font-extrabold">{survey.name}</h1>
        <SurveyStatusBadge status={survey.status} />
        {survey.has_unpublished_changes && <span className="text-xs font-medium text-muted-foreground">{t("unpublishedChanges")}</span>}
        {canManage && (survey.status === "published" || survey.status === "paused") && (
          <SurveyStatusControl surveyId={survey.id} status={survey.status} />
        )}
      </div>
      <nav className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active === tab.key ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold outline-none focus-visible:shadow-focus",
              active === tab.key ? "border-ultramarine text-ink" : "border-transparent text-muted-foreground hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
