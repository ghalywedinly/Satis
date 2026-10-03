import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SurveyStatus } from "@/types/database";

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const t = useTranslations("surveys.status");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "published" ? "bg-mint-50 text-mint-700" : status === "paused" ? "bg-ember-50 text-ember-700" : "bg-sand-100 text-ink-600",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", status === "published" ? "bg-mint-500" : status === "paused" ? "bg-ember-500" : "bg-ink-400")} />
      {t(status)}
    </span>
  );
}
