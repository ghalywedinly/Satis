import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SatisLogo } from "@/components/brand/satis-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { requireUser } from "@/lib/auth/session";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { AdminTabs } from "@/modules/bookings/components/admin-tabs";
import { isPlatformAdmin } from "@/modules/bookings/queries";

/** The Satis team's own area. Anyone else gets "not found", as if it didn't exist. */
export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  await requireUser(locale);
  if (!(await isPlatformAdmin())) notFound();
  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <header className="border-b border-ink-800 bg-ink text-sand">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-8">
          <Link href="/admin/bookings" className="flex items-center gap-3 rounded-control outline-none focus-visible:shadow-focus">
            <SatisLogo size={22} tone="sand-zest" locale={locale} />
            <span className="rounded-full bg-ink-800 px-2.5 py-1 text-xs font-semibold text-ink-200">{t("team")}</span>
          </Link>
          <AdminTabs />
          <div className="ms-auto flex items-center gap-2">
            <LanguageSwitcher className="text-sand hover:bg-ink-800 hover:text-sand" />
            <Link
              href="/dashboard"
              className="flex h-9 items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-ink-200 outline-none hover:bg-ink-800 hover:text-sand focus-visible:shadow-focus"
            >
              <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4 rtl:-scale-x-100" />
              {t("nav.backToApp")}
            </Link>
          </div>
        </div>
      </header>
      <main id="content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
