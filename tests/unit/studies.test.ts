import { describe, expect, it } from "vitest";
import { contrast, isDarkColor, mix, textOn, themeVars } from "@/modules/surveys/color";
import { normalizeParticipantCode, type Question } from "@/modules/surveys/definition";
import { themeSchema } from "@/modules/surveys/schemas";
import { buildReport, type StudyResponse } from "@/modules/studies/report";
import { effectLabel, pairedTest, summarize, twoTailedP, welchTest } from "@/modules/studies/stats";

describe("t distribution", () => {
  // Two-tailed critical values at p = 0.05, from standard t tables.
  it.each([
    [12.706, 1],
    [2.776, 4],
    [2.228, 10],
    [2.042, 30],
  ])("t = %s with %s degrees of freedom gives p ≈ 0.05", (t, df) => {
    expect(twoTailedP(t, df)).toBeCloseTo(0.05, 3);
  });

  it("is 1 at t = 0 and symmetric", () => {
    expect(twoTailedP(0, 8)).toBeCloseTo(1, 10);
    expect(twoTailedP(-2.228, 10)).toBeCloseTo(twoTailedP(2.228, 10), 12);
  });
});

describe("tests", () => {
  const pre = [2, 3, 3, 4, 2];
  const post = [4, 4, 3, 5, 4];

  it("summarizes values", () => {
    const s = summarize(pre);
    expect(s.n).toBe(5);
    expect(s.mean).toBeCloseTo(2.8, 10);
    expect(s.sd).toBeCloseTo(0.83666, 4);
    expect(summarize([])).toEqual({ n: 0, mean: null, sd: null });
  });

  it("runs a paired t-test on matched participants", () => {
    const result = pairedTest(pre, post)!;
    expect(result.kind).toBe("paired");
    expect(result.meanChange).toBeCloseTo(1.2, 10);
    expect(result.t).toBeCloseTo(3.2071, 3);
    expect(result.df).toBe(4);
    // Between the 0.05 (2.776) and 0.02 (3.747) critical values for 4 df.
    expect(result.p!).toBeGreaterThan(0.02);
    expect(result.p!).toBeLessThan(0.05);
    expect(result.effectSize).toBeCloseTo(1.4343, 3);
    expect(effectLabel(result.effectSize)).toBe("large");
  });

  it("runs Welch's t-test on independent groups", () => {
    const result = welchTest(pre, post)!;
    expect(result.kind).toBe("welch");
    expect(result.meanChange).toBeCloseTo(1.2, 10);
    expect(result.p!).toBeGreaterThan(0.02);
    expect(result.p!).toBeLessThan(0.1);
  });

  it("needs at least two answers, and handles no spread", () => {
    expect(pairedTest([3], [4])).toBeNull();
    expect(welchTest([3], [4, 5])).toBeNull();
    expect(pairedTest([3, 4], [4, 5])).toMatchObject({ meanChange: 1, t: null, p: null });
    expect(pairedTest([3, 4], [3, 4])).toMatchObject({ meanChange: 0, p: 1 });
  });
});

describe("study report", () => {
  const rating: Question = { id: "q1", type: "rating", required: true, title: { en: "Knowledge" } };
  const choice: Question = {
    id: "q2",
    type: "single_choice",
    required: false,
    title: { en: "How often?" },
    options: [
      { id: "o1", label: { en: "Never" } },
      { id: "o2", label: { en: "Often" } },
    ],
  };
  const text: Question = { id: "q3", type: "text", required: false, title: { en: "Comments" } };
  const extra: Question = { id: "q4", type: "nps", required: false, title: { en: "Recommend" } };

  const response = (phase: "pre" | "post", participant: string | null, answers: StudyResponse["answers"], minute: number): StudyResponse => ({
    phase,
    participant,
    submittedAt: `2026-11-04T10:${String(minute).padStart(2, "0")}:00Z`,
    locale: "en",
    location: "Jeddah",
    answers,
  });

  const responses = [
    response("pre", "P1", { q1: { number: 2 }, q2: { options: ["o1"] }, q3: { text: "Unsure" } }, 1),
    response("pre", "P2", { q1: { number: 3 }, q2: { options: ["o1"] } }, 2),
    response("pre", "P3", { q1: { number: 2 }, q2: { options: ["o2"] } }, 3),
    response("post", "P1", { q1: { number: 4 }, q2: { options: ["o2"] }, q4: { number: 9 } }, 4),
    response("post", "P2", { q1: { number: 3 }, q2: { options: ["o2"] }, q3: { text: "Much clearer" } }, 5),
  ];

  const report = buildReport({ pre: [rating, choice, text], post: [rating, choice, text, extra], responses, matchParticipants: true });

  it("counts responses and matched participants", () => {
    expect(report.responses).toEqual({ pre: 3, post: 2 });
    expect(report.matched).toBe(2);
  });

  it("compares ratings, paired by participant", () => {
    const q = report.questions[0];
    if (q.kind !== "scale") throw new Error("expected a scale");
    expect(q.pre.mean).toBeCloseTo(7 / 3, 10);
    expect(q.post.mean).toBeCloseTo(3.5, 10);
    expect(q.distribution.pre).toEqual([0, 2, 1, 0, 0]);
    expect(q.movement).toEqual({ improved: 1, same: 1, declined: 0 });
    expect(q.test?.kind).toBe("paired");
    expect(q.test?.meanChange).toBeCloseTo(1, 10);
  });

  it("compares choices as shares of those who answered", () => {
    const q = report.questions[1];
    if (q.kind !== "choice") throw new Error("expected a choice");
    expect(q.options).toEqual([
      { id: "o1", pre: 2 / 3, post: 0, preCount: 2, postCount: 0 },
      { id: "o2", pre: 1 / 3, post: 1, preCount: 1, postCount: 2 },
    ]);
  });

  it("keeps the latest comments and questions only one survey asked", () => {
    const q = report.questions[2];
    if (q.kind !== "text") throw new Error("expected text");
    expect(q.latest).toEqual({ pre: ["Unsure"], post: ["Much clearer"] });
    const added = report.questions[3];
    expect(added).toMatchObject({ id: "q4", inPre: false, inPost: true, kind: "scale" });
  });

  it("uses Welch's test when participants aren't matched", () => {
    const open = buildReport({ pre: [rating], post: [rating], responses, matchParticipants: false });
    expect(open.matched).toBeNull();
    const q = open.questions[0];
    if (q.kind !== "scale") throw new Error("expected a scale");
    expect(q.test?.kind).toBe("welch");
    expect(q.movement).toBeNull();
  });
});

describe("participant codes", () => {
  it.each([
    [" p-014 ", "P-014"],
    ["p 014", "P014"],
    ["٠١٤", "014"],
    ["ab_12", "AB_12"],
  ])("%s → %s", (raw, code) => expect(normalizeParticipantCode(raw)).toBe(code));

  it.each(["", "P-014!", "رمز", "x".repeat(41)])("rejects %s", (raw) => expect(normalizeParticipantCode(raw)).toBeNull());
});

describe("custom survey colours", () => {
  it("picks readable text for any colour", () => {
    expect(textOn("#FFCF28")).toBe("#0B0D12");
    expect(textOn("#0F766E")).toBe("#FFFFFF");
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(isDarkColor("#0B0D12")).toBe(true);
    expect(isDarkColor("#FFF7ED")).toBe(false);
  });

  it("sets CSS variables only for custom choices", () => {
    expect(themeVars({ accent: "ultramarine", background: "sand", ratingStyle: "slices" })).toEqual({});
    const vars = themeVars({ accent: "custom", accentColor: "#FFE14D", background: "custom", backgroundColor: "#111111", ratingStyle: "slices", font: "cairo" }) as Record<string, string>;
    expect(vars["--sv-accent-fg"]).toBe("#0B0D12");
    // Too faint to read on white: links and outlines fall back to Ink.
    expect(vars["--sv-accent-on-light"]).toBe("#0B0D12");
    expect(vars["--sv-page-fg"]).toBe("#FAF8F4");
    expect(vars["--font-arabic"]).toContain("Satis Cairo");
  });

  it("validates themes like the database does", () => {
    const base = { accent: "custom", background: "sand", ratingStyle: "stars" };
    expect(themeSchema.safeParse({ ...base, accentColor: "#0F766E" }).success).toBe(true);
    expect(themeSchema.safeParse(base).success).toBe(false);
    expect(themeSchema.safeParse({ ...base, accentColor: "teal" }).success).toBe(false);
    expect(themeSchema.safeParse({ ...base, accentColor: "#0F766E", logo: { src: "https://example.com/logo.png", position: "start", size: "md" } }).success).toBe(false);
    expect(themeSchema.safeParse({ ...base, accentColor: "#0F766E", logo: { src: "data:image/png;base64,iVBORw0KGgo=", position: "start", size: "md" } }).success).toBe(true);
  });
});
