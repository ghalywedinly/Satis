import { GoogleTagManager } from "@/components/marketing/google-tag-manager";
import { resolveLocale } from "@/lib/i18n/server";

/** Public marketing pages: the only place third-party tags (Google Tag Manager) are loaded. */
export default async function MarketingLayout({ children, params }: LayoutProps<"/[locale]">) {
  await resolveLocale(params);
  return (
    <>
      {children}
      <GoogleTagManager />
    </>
  );
}
