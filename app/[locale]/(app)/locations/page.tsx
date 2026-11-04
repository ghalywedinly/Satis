import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { formatCount } from "@/lib/i18n/format";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LocationDialog } from "@/modules/locations/components/location-dialog";
import { LocationList } from "@/modules/locations/components/location-list";

export async function generateMetadata({ params }: PageProps<"/[locale]/locations">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "locations" });
  return { title: t("metaTitle") };
}

export default async function LocationsPage({ params }: PageProps<"/[locale]/locations">) {
  const locale = await resolveLocale(params);
  const { membership } = await requireMembership(locale);
  const t = await getTranslations({ locale, namespace: "locations" });
  const canManage = can(membership.role, "locations.manage");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("locations")
    .select("id, name, city, address, archived_at")
    .eq("organization_id", membership.organization.id)
    .order("name");
  const locations = data ?? [];
  const active = locations.filter((l) => !l.archived_at);
  const archived = locations.filter((l) => l.archived_at);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && <LocationDialog />}
      </div>
      {!canManage && <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}
      {active.length > 0 ? (
        <LocationList locations={active} canManage={canManage} />
      ) : (
        <p className="text-muted-foreground">{t("empty")}</p>
      )}
      {archived.length > 0 && (
        <details className="group flex flex-col gap-3">
          <summary className="cursor-pointer self-start rounded-control text-sm font-semibold text-muted-foreground outline-none focus-visible:shadow-focus">
            {t("showArchived", { count: formatCount(locale, archived.length) })}
          </summary>
          <div className="mt-3">
            <LocationList locations={archived} canManage={canManage} archived />
          </div>
        </details>
      )}
    </div>
  );
}
