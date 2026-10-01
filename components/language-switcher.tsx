"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { saveLocalePreference } from "@/modules/auth/actions";

/**
 * Switches between Arabic and English on the current page. For signed-in users
 * (`persist`), the choice is also saved to their profile for future sessions and emails.
 */
export function LanguageSwitcher({ persist = false }: { persist?: boolean }) {
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
      size="sm"
      disabled={pending}
      aria-label={`${t("label")}: ${t(other)}`}
      onClick={() =>
        startTransition(async () => {
          if (persist) await saveLocalePreference(other);
          router.replace(pathname, { locale: other });
        })
      }
    >
      <Languages aria-hidden strokeWidth={1.75} />
      <span lang={other} className={other === "ar" ? "font-arabic" : "font-sans"}>
        {t(other)}
      </span>
    </Button>
  );
}
