import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCount } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { captureServerEvent } from "@/lib/observability/analytics";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { filtersToQuery, isFiltered, PAGE_SIZE, parseFilters } from "@/modules/feedback/filters";
import { InboxFilterBar } from "@/modules/feedback/components/inbox-filters";
import { ResponseList } from "@/modules/feedback/components/response-list";
import { getFilterOptions, listResponses } from "@/modules/feedback/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/inbox">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "inbox" });
  return { title: t("metaTitle") };
}

export default async function InboxPage({ params, searchParams }: PageProps<"/[locale]/inbox">) {
  const locale = await resolveLocale(params);
  const { user, membership } = await requireMembership(locale);
  const organizationId = membership.organization.id;
  const filters = parseFilters(await searchParams);
  const [t, options, { rows, total }] = await Promise.all([
    getTranslations({ locale, namespace: "inbox" }),
    getFilterOptions(organizationId),
    listResponses(organizationId, filters),
  ]);
  captureServerEvent("inbox_viewed", user.id, { organization_id: organizationId, filtered: isFiltered(filters) });

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query = filtersToQuery(filters);
  const pageHref = (page: number) => `/inbox${filtersToQuery({ ...filters, page })}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex max-w-2xl flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      {!can(membership.role, "feedback.triage") && <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}

      <InboxFilterBar key={query} filters={filters} surveys={options.surveys} locations={options.locations} tags={options.tags} />

      <p className="text-sm font-semibold text-muted-foreground" aria-live="polite">
        {t("total", { count: formatCount(locale, total) })}
      </p>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4">
            {isFiltered(filters) ? (
              <>
                <h2 className="text-xl font-bold">{t("noMatches.title")}</h2>
                <Button asChild variant="outline">
                  <Link href="/inbox">{t("noMatches.action")}</Link>
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">{t("empty.title")}</h2>
                <p className="text-muted-foreground">{t("empty.body")}</p>
                <Button asChild variant="outline">
                  <Link href="/surveys">{t("empty.action")}</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <ResponseList rows={rows} backQuery={query} />
      )}

      {pages > 1 && (
        <nav aria-label={t("pagination.label")} className="flex items-center justify-between gap-3">
          {filters.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filters.page - 1)}>
                <ChevronLeft aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
                {t("pagination.previous")}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            {t("pagination.page", { page: formatCount(locale, filters.page), pages: formatCount(locale, pages) })}
          </span>
          {filters.page < pages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filters.page + 1)}>
                {t("pagination.next")}
                <ChevronRight aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
