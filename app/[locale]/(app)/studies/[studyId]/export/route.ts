import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
import { getActiveMembership } from "@/lib/org/context";
import { getStudy, getStudyResponses } from "@/modules/studies/queries";
import { textIn, type Question } from "@/modules/surveys/definition";

/** Spreadsheet cells: quoted, with formulas neutralised so a cell can never run in Excel. */
const cell = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Every answer of a study, one row per response, for analysis in a spreadsheet or SPSS/R. */
export async function GET(_request: Request, { params }: RouteContext<"/[locale]/studies/[studyId]/export">) {
  const { locale: rawLocale, studyId } = await params;
  const locale: Locale = routing.locales.includes(rawLocale as Locale) ? (rawLocale as Locale) : routing.defaultLocale;
  const membership = await getActiveMembership();
  if (!membership) return new Response(null, { status: 404 });
  const study = await getStudy(membership.organization.id, studyId);
  if (!study || !study.pre || !study.post) return new Response(null, { status: 404 });

  const [t, responses] = await Promise.all([getTranslations({ locale, namespace: "studies" }), getStudyResponses(study.id)]);
  const fallback = study.pre.defaultLocale ?? membership.organization.default_locale;
  const preIds = new Set(study.pre.reportQuestions.map((q) => q.id));
  const questions: Question[] = [...study.pre.reportQuestions, ...study.post.reportQuestions.filter((q) => !preIds.has(q.id))];
  const optionLabel = new Map(
    [...study.pre.reportQuestions, ...study.post.reportQuestions].flatMap((q) =>
      q.type === "single_choice" || q.type === "multiple_choice" ? q.options.map((o) => [o.id, textIn(o.label, locale, fallback)] as const) : [],
    ),
  );

  const header = [t("csv.phase"), t("csv.participant"), t("csv.submittedAt"), t("csv.language"), t("csv.location"), ...questions.map((q) => textIn(q.title, locale, fallback))];
  const rows = responses.map((r) => [
    t(`phase.${r.phase}`),
    r.participant ?? "",
    r.submittedAt,
    r.locale,
    r.location ?? "",
    ...questions.map((q) => {
      const answer = r.answers[q.id];
      if (!answer) return "";
      if (typeof answer.number === "number") return String(answer.number);
      if (answer.options) return answer.options.map((id) => optionLabel.get(id) ?? id).join("; ");
      return answer.text ?? "";
    }),
  ]);

  captureServerEvent("study_exported", membership.organization.id, { rows: rows.length });
  // A byte-order mark so Excel opens Arabic text correctly.
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
  const filename = `${study.name.replace(/[\\/:*?"<>|]+/g, " ").trim() || "study"}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="study.csv"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
