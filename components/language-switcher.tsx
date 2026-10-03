"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { saveLocalePreference } from "@/modules/auth/actions";

/**
 * Switches between Arabic and English on the current page. For signed-in users
 * (`persist`), the choice is also saved to their profile for future sessions and emails.
 */
export function LanguageSwitcher({ persist = false, iconOnly = false, className }: { persist?: boolean; iconOnly?: boolean; className?: string }) {
  const t = useTranslations("common.language");
  const locale = useLocale();
  const other = routing.locales.find((l) => l !== locale)!;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      className={className}
      disabled={pending}
      aria-label={`${t("label")}: ${t(other)}`}
      title={iconOnly ? t(other) : undefined}
      onClick={() =>
        startTransition(async () => {
          if (persist) await saveLocalePreference(other);
          router.replace(pathname, { locale: other });
        })
      }
    >
      <Languages aria-hidden strokeWidth={1.75} />
      <span lang={other} className={cn(other === "ar" ? "font-arabic" : "font-sans", iconOnly && "sr-only")}>
        {t(other)}
      </span>
    </Button>
  );
}
