import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeDirection, routing } from "@/lib/i18n/routing";
import { Providers } from "@/components/providers";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale });
  return {
    title: { default: t("metadata.title"), template: `%s · ${t("common.appName")}` },
    description: t("metadata.description"),
    // The name under the icon when the site is added to an iPhone home screen.
    appleWebApp: { title: t("common.appName") },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} dir={localeDirection(locale)} className={fontVariables}>
      <body>
        <NextIntlClientProvider>
          <Providers dir={localeDirection(locale)}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
