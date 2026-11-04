"use client";

import { Archive, ArchiveRestore, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { Button } from "@/components/ui/button";
import { setLocationArchived } from "../actions";
import { LocationDialog, type LocationValues } from "./location-dialog";

export function LocationList({ locations, canManage, archived = false }: { locations: LocationValues[]; canManage: boolean; archived?: boolean }) {
  const t = useTranslations("locations");
  const locale = useLocale();

  return (
    <ul className="flex flex-col divide-y divide-ink-100 rounded-card border glass">
      {locations.map((location) => (
        <li key={location.id} className="flex items-center gap-4 px-5 py-4">
          <MapPin aria-hidden strokeWidth={1.75} className="size-5 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-semibold">{location.name}</span>
            {(location.city || location.address) && (
              <span className="truncate text-sm text-muted-foreground">{[location.city, location.address].filter(Boolean).join(" · ")}</span>
            )}
          </div>
          {canManage && (
            <div className="flex shrink-0 items-center gap-1">
              {!archived && <LocationDialog location={location} />}
              {archived ? (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("restoreNamed", { name: location.name })}
                  onClick={() => setLocationArchived(locale, location.id, false)}
                >
                  <ArchiveRestore aria-hidden strokeWidth={1.75} />
                  {t("restore")}
                </Button>
              ) : (
                <ConfirmAction
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={t("archiveNamed", { name: location.name })}>
                      <Archive aria-hidden strokeWidth={1.75} />
                    </Button>
                  }
                  title={t("archiveNamed", { name: location.name })}
                  description={t("archiveConfirm")}
                  confirmLabel={t("archive")}
                  cancelLabel={t("cancel")}
                  onConfirm={() => setLocationArchived(locale, location.id, true)}
                />
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
