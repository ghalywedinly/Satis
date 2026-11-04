import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { isTheme } from "../taxonomy";

/** What a comment praises and complains about, as tagged by AI. Complaints first. */
export function AiThemeChips({ praise, complaints, className }: { praise: string[]; complaints: string[]; className?: string }) {
  const t = useTranslations("ai");
  const chips = [...complaints.filter(isTheme).map((theme) => ({ theme, kind: "complaint" as const })), ...praise.filter(isTheme).map((theme) => ({ theme, kind: "praise" as const }))];
  if (chips.length === 0) return null;
  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Sparkles aria-label={t("label")} strokeWidth={1.75} className="size-3.5 text-grape-500" />
      {chips.map(({ theme, kind }) => (
        <span
          key={`${kind}-${theme}`}
          className={cn("rounded-full px-2 py-0.5 text-xs font-medium", kind === "complaint" ? "bg-ember-50 text-ember-700" : "bg-mint-50 text-mint-700")}
        >
          <span className="sr-only">{kind === "complaint" ? t("complained") : t("praised")}: </span>
          {t(`themes.${theme}`)}
        </span>
      ))}
    </span>
  );
}
