"use client";

import Form from "next/form";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PERIODS, type DashboardFilters } from "../period";

type Option = { id: string; name: string };

/** One row of filters above the charts. Menus apply on change; a custom range applies with its button. */
export function DashboardFilterBar({ filters, today, locations, surveys }: { filters: DashboardFilters; today: string; locations: Option[]; surveys: Option[] }) {
  const t = useTranslations("dashboard.filters");
  const [period, setPeriod] = useState(filters.period);
  const submit = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();

  return (
    <Form action="" replace scroll={false} aria-label={t("label")} className="flex flex-wrap items-end gap-3 rounded-card border glass p-4">
      <label className="flex min-w-36 flex-1 flex-col gap-1.5 text-sm font-medium sm:flex-none">
        {t("period")}
        <NativeSelect
          name="period"
          value={period}
          onChange={(e) => {
            const next = e.target.value as DashboardFilters["period"];
            setPeriod(next);
            if (next !== "custom") e.currentTarget.form?.requestSubmit();
          }}
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {t(`periods.${p}`)}
            </option>
          ))}
        </NativeSelect>
      </label>
      {period === "custom" && (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("from")}
            <Input type="date" name="from" required max={today} defaultValue={filters.from} className="w-40" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("to")}
            <Input type="date" name="to" required max={today} defaultValue={filters.to ?? today} className="w-40" />
          </label>
          <Button type="submit" variant="outline">
            {t("apply")}
          </Button>
        </>
      )}
      <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm font-medium">
        {t("location")}
        <NativeSelect name="location" defaultValue={filters.location ?? ""} onChange={submit}>
          <option value="">{t("allLocations")}</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </NativeSelect>
      </label>
      <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm font-medium">
        {t("survey")}
        <NativeSelect name="survey" defaultValue={filters.survey ?? ""} onChange={submit}>
          <option value="">{t("allSurveys")}</option>
          {surveys.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      </label>
    </Form>
  );
}
