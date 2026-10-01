import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SurveyScreen } from "@/components/survey/survey-screen";
import { COPY, LOCALES, isLocale } from "@/components/survey/copy";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/survey">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: `${COPY[lang].question} · Satis` };
}

export default async function SurveyPage({ params }: PageProps<"/[lang]/survey">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <SurveyScreen locale={lang} />;
}
