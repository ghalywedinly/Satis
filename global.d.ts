import type { routing } from "@/lib/i18n/routing";
import type { Messages } from "@/locales";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
