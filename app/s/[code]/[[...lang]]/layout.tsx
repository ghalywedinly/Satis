import { fontVariables } from "../../../fonts";
import { getPublicSurvey, resolveSurveyLocale } from "@/modules/surveys/public-data";
import "../../../globals.css";

/**
 * Root layout for public surveys (separate from the app's): no app providers, analytics or
 * dashboard code, and <html lang/dir> set from the survey's language.
 */
export default async function PublicSurveyLayout({ children, params }: LayoutProps<"/s/[code]/[[...lang]]">) {
  const { code, lang } = await params;
  const locale = resolveSurveyLocale(await getPublicSurvey(code), lang) ?? "ar";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={fontVariables}>
      <body className="bg-sand">{children}</body>
    </html>
  );
}
