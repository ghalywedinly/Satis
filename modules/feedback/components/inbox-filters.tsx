"use client";

import Form from "next/form";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Link } from "@/lib/i18n/navigation";
import { PERIODS, SENTIMENTS, STATUSES, type InboxFilters } from "../filters";

type Option = { id: string; name: string };

/**
 * A GET form: filters become the URL's query string, so views can be bookmarked and shared.
 * Menus apply as soon as they change; the search applies on Enter or with its button.
 */
export function InboxFilterBar({
  filters,
  surveys,
  locations,
  tags,
}: {
  filters: InboxFilters;
  surveys: Option[];
  locations: Option[];
  tags: Option[];
}) {
  const t = useTranslations("inbox.filters");
  const tStatus = useTranslations("inbox.status");
  const tSentiment = useTranslations("inbox.sentiment");
  const submit = (e: React.ChangeEvent<HTMLElement>) => (e.currentTarget as HTMLInputElement).form?.requestSubmit();

  const select = (name: keyof InboxFilters, label: string, value: string | undefined, options: { value: string; label: string }[], allLabel?: string) => (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-medium">
      {label}
      <NativeSelect name={name} defaultValue={value ?? ""} onChange={submit}>
        {allLabel !== undefined && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </label>
  );

  return (
    <Form action="" replace aria-label={t("label")} className="flex flex-col gap-4 rounded-card border border-border bg-white p-4 sm:p-5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search aria-hidden strokeWidth={1.75} className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            maxLength={100}
            aria-label={t("search")}
            placeholder={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>
        <Button type="submit" variant="outline">
          {t("searchButton")}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {select("period", t("period"), filters.period, PERIODS.map((p) => ({ value: p, label: t(`periods.${p}`) })))}
        {select("status", t("status"), filters.status, STATUSES.map((s) => ({ value: s, label: tStatus(s) })), t("all"))}
        {select("sentiment", t("sentiment"), filters.sentiment, SENTIMENTS.map((s) => ({ value: s, label: tSentiment(s) })), t("all"))}
        {select("survey", t("survey"), filters.survey, surveys.map((s) => ({ value: s.id, label: s.name })), t("allSurveys"))}
        {select("location", t("location"), filters.location, locations.map((l) => ({ value: l.id, label: l.name })), t("allLocations"))}
        {select("tag", t("tag"), filters.tag, tags.map((g) => ({ value: g.id, label: g.name })), t("allTags"))}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {(["unread", "important", "comments"] as const).map((name) => (
          <label key={name} className="flex items-center gap-2">
            <input type="checkbox" name={name} value="1" defaultChecked={filters[name]} onChange={submit} className="size-4 accent-ultramarine" />
            {t(name)}
          </label>
        ))}
        <noscript>
          <Button type="submit" size="sm">
            {t("apply")}
          </Button>
        </noscript>
        <Link href="/inbox" className="ms-auto font-semibold text-ultramarine underline-offset-4 hover:underline">
          {t("clear")}
        </Link>
      </div>
    </Form>
  );
}
