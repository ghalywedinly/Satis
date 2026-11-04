import type { Question } from "@/modules/surveys/definition";
import { pairedTest, summarize, welchTest, type Summary, type TestResult } from "./stats";

/*
 * The study report: each question compared before and after. Questions are matched by id, so a
 * post-survey copied from the pre-survey lines up question by question. Pure, for unit tests.
 */

export type Phase = "pre" | "post";

export type StudyAnswer = { number?: number; options?: string[]; text?: string };
export type StudyResponse = {
  phase: Phase;
  participant: string | null;
  submittedAt: string;
  locale: "ar" | "en";
  location: string | null;
  answers: Record<string, StudyAnswer>;
};

type Base = { id: string; question: Question; inPre: boolean; inPost: boolean };

export type ScaleReport = Base & {
  kind: "scale";
  /** 1–5 ratings or 0–10 recommendation scores. */
  min: number;
  max: number;
  pre: Summary;
  post: Summary;
  /** How many answered each value, from min to max. */
  distribution: { pre: number[]; post: number[] };
  test: TestResult | null;
  /** Matched participants only: how many scored higher, the same, or lower afterwards. */
  movement: { improved: number; same: number; declined: number } | null;
};

export type ChoiceReport = Base & {
  kind: "choice";
  answered: { pre: number; post: number };
  /** Share of those who answered that picked each option. */
  options: { id: string; pre: number; post: number; preCount: number; postCount: number }[];
};

export type TextReport = Base & {
  kind: "text";
  answered: { pre: number; post: number };
  /** The most recent comments, newest first. */
  latest: { pre: string[]; post: string[] };
};

export type QuestionReport = ScaleReport | ChoiceReport | TextReport;

export type StudyReport = {
  responses: { pre: number; post: number };
  /** Participants who answered both surveys (null when the study doesn't match participants). */
  matched: number | null;
  questions: QuestionReport[];
};

const LATEST_COMMENTS = 3;

export function buildReport({
  pre,
  post,
  responses,
  matchParticipants,
}: {
  pre: Question[];
  post: Question[];
  responses: StudyResponse[];
  matchParticipants: boolean;
}): StudyReport {
  const byPhase = { pre: responses.filter((r) => r.phase === "pre"), post: responses.filter((r) => r.phase === "post") };

  // Latest answer per participant per phase (the database allows one, but be safe).
  const byParticipant = (phase: Phase) => {
    const map = new Map<string, StudyResponse>();
    for (const r of byPhase[phase]) if (r.participant) map.set(r.participant, r);
    return map;
  };
  const preByCode = byParticipant("pre");
  const postByCode = byParticipant("post");
  const matchedCodes = matchParticipants ? [...preByCode.keys()].filter((code) => postByCode.has(code)) : [];

  // Questions in pre-survey order, then any the post-survey added.
  const postById = new Map(post.map((q) => [q.id, q]));
  const preIds = new Set(pre.map((q) => q.id));
  const ordered: { question: Question; inPre: boolean; inPost: boolean }[] = [
    ...pre.map((q) => {
      const other = postById.get(q.id);
      return { question: other && other.type !== q.type ? q : (other ?? q), inPre: true, inPost: !!other && other.type === q.type };
    }),
    ...post.filter((q) => !preIds.has(q.id) || pre.find((p) => p.id === q.id)?.type !== q.type).map((q) => ({ question: q, inPre: false, inPost: true })),
  ];

  const questions = ordered.map(({ question, inPre, inPost }): QuestionReport => {
    const id = question.id;
    const answersIn = (phase: Phase) => (phase === "pre" ? inPre : inPost) ? byPhase[phase].map((r) => r.answers[id]).filter(Boolean) : [];
    const base = { id, question, inPre, inPost };

    if (question.type === "rating" || question.type === "nps") {
      const [min, max] = question.type === "rating" ? [1, 5] : [0, 10];
      const values = (phase: Phase) => answersIn(phase).map((a) => a.number).filter((n): n is number => typeof n === "number");
      const preValues = values("pre");
      const postValues = values("post");
      const distribution = (list: number[]) => Array.from({ length: max - min + 1 }, (_, i) => list.filter((v) => v === min + i).length);

      let test: TestResult | null = null;
      let movement: ScaleReport["movement"] = null;
      if (matchParticipants && inPre && inPost) {
        const pairs = matchedCodes
          .map((code) => [preByCode.get(code)!.answers[id]?.number, postByCode.get(code)!.answers[id]?.number])
          .filter((pair): pair is [number, number] => typeof pair[0] === "number" && typeof pair[1] === "number");
        test = pairedTest(pairs.map((p) => p[0]), pairs.map((p) => p[1]));
        if (pairs.length > 0) {
          movement = {
            improved: pairs.filter(([a, b]) => b > a).length,
            same: pairs.filter(([a, b]) => b === a).length,
            declined: pairs.filter(([a, b]) => b < a).length,
          };
        }
      }
      if (!test && inPre && inPost) test = welchTest(preValues, postValues);

      return {
        ...base,
        kind: "scale",
        min,
        max,
        pre: summarize(preValues),
        post: summarize(postValues),
        distribution: { pre: distribution(preValues), post: distribution(postValues) },
        test,
        movement,
      };
    }

    if (question.type === "single_choice" || question.type === "multiple_choice") {
      const chosen = (phase: Phase) => answersIn(phase).map((a) => a.options ?? []).filter((o) => o.length > 0);
      const preChosen = chosen("pre");
      const postChosen = chosen("post");
      const share = (list: string[][], option: string) => {
        const count = list.filter((o) => o.includes(option)).length;
        return { count, share: list.length ? count / list.length : 0 };
      };
      return {
        ...base,
        kind: "choice",
        answered: { pre: preChosen.length, post: postChosen.length },
        options: question.options.map((option) => {
          const a = share(preChosen, option.id);
          const b = share(postChosen, option.id);
          return { id: option.id, pre: a.share, post: b.share, preCount: a.count, postCount: b.count };
        }),
      };
    }

    const texts = (phase: Phase) =>
      answersIn(phase)
        .map((a) => a.text?.trim())
        .filter((t): t is string => !!t);
    const preTexts = texts("pre");
    const postTexts = texts("post");
    return {
      ...base,
      kind: "text",
      answered: { pre: preTexts.length, post: postTexts.length },
      latest: { pre: preTexts.slice(-LATEST_COMMENTS).reverse(), post: postTexts.slice(-LATEST_COMMENTS).reverse() },
    };
  });

  return {
    responses: { pre: byPhase.pre.length, post: byPhase.post.length },
    matched: matchParticipants ? matchedCodes.length : null,
    questions,
  };
}
