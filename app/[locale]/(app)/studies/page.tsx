import type { Metadata } from "next";
import { ChevronRight, Plus, UsersRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { formatCount, formatDate } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { listStudies } from "@/modules/studies/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/studies">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "studies" });
  return { title: t("metaTitle") };
}

export default async function StudiesPage({ params }: PageProps<"/[locale]/studies">) {
  const locale = await resolveLocale(params);
  const { membership } = await requireMembership(locale);
  const t = await getTranslations({ locale, namespace: "studies" });
  const canManage = can(membership.role, "surveys.manage");
  const studies = await listStudies(membership.organization.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/studies/new">
              <Plus aria-hidden strokeWidth={1.75} />
              {t("create")}
            </Link>
          </Button>
        )}
      </div>
      {!canManage && <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}

      {studies.length === 0 ? (
        <section className="grid gap-8 overflow-hidden rounded-card border border-border bg-white p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-extrabold">{t("empty.title")}</h2>
            <p className="max-w-[52ch] text-muted-foreground">{t("empty.body")}</p>
            {canManage && (
              <Button asChild className="mt-2 self-start">
                <Link href="/studies/new">{t("empty.action")}</Link>
              </Button>
            )}
          </div>
          <ol className="flex flex-col gap-3">
            {(["before", "during", "after"] as const).map((step, i) => (
              <li key={step} className="flex items-center gap-4 rounded-tile bg-sand-50 p-4">
                <span
                  aria-hidden
                  className={cn(
                    "slice-sm flex h-9 w-11 shrink-0 items-center justify-center font-display font-extrabold",
                    i === 1 ? "bg-ember text-ink" : i === 2 ? "bg-ultramarine text-white" : "bg-ink text-sand",
                  )}
                >
                  {formatCount(locale, i + 1)}
                </span>
                <span className="font-medium">{t(`empty.steps.${step}`)}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <ul className="flex flex-col divide-y divide-ink-100 rounded-card border glass">
          {studies.map((study) => (
            <li key={study.id}>
              <Link
                href={`/studies/${study.id}`}
                className="flex items-center gap-4 rounded-card px-5 py-4 outline-none hover:bg-sand-50 focus-visible:shadow-focus"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="truncate font-semibold">{study.name}</span>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {(["pre", "post"] as const).map((phase) => (
                      <span key={phase} className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-semibold text-ink-600">
                        {t(`phase.${phase}`)} · {t("answers", { count: formatCount(locale, study[phase]?.responses ?? 0) })}
                      </span>
                    ))}
                    {study.match_participants && (
                      <span className="flex items-center gap-1 text-xs">
                        <UsersRound aria-hidden strokeWidth={1.75} className="size-3.5" />
                        {t("matchedOn")}
                      </span>
                    )}
                    <span className="text-xs">{formatDate(locale, study.created_at)}</span>
                  </span>
                </div>
                <ChevronRight aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
