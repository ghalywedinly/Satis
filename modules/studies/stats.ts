/*
 * Statistics for comparing a pre-survey with a post-survey. Pure and dependency-free.
 *   - Matched participants (same code before and after): paired t-test, effect size dz.
 *   - Otherwise: Welch's t-test (unequal variances), effect size Cohen's d (pooled SD).
 * p-values are two-tailed, from Student's t distribution.
 */

export type Summary = { n: number; mean: number | null; sd: number | null };

export function summarize(values: number[]): Summary {
  const n = values.length;
  if (n === 0) return { n, mean: null, sd: null };
  const mean = values.reduce((a, b) => a + b, 0) / n;
  if (n < 2) return { n, mean, sd: null };
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1);
  return { n, mean, sd: Math.sqrt(variance) };
}

export type TestResult = {
  kind: "paired" | "welch";
  /** Number of pairs (paired) or the smaller group size (Welch). */
  n: number;
  /** Post minus pre. */
  meanChange: number;
  t: number | null;
  df: number | null;
  p: number | null;
  /** Cohen's dz (paired) or d (Welch). */
  effectSize: number | null;
};

/** Paired t-test on matched values (same participant, before and after). Needs 2+ pairs. */
export function pairedTest(pre: number[], post: number[]): TestResult | null {
  const n = Math.min(pre.length, post.length);
  if (n < 2) return null;
  const diffs = Array.from({ length: n }, (_, i) => post[i] - pre[i]);
  const { mean, sd } = summarize(diffs);
  const meanChange = mean ?? 0;
  if (!sd) {
    // Everyone changed by exactly the same amount: no spread to test against.
    return { kind: "paired", n, meanChange, t: null, df: n - 1, p: meanChange === 0 ? 1 : null, effectSize: null };
  }
  const t = meanChange / (sd / Math.sqrt(n));
  const df = n - 1;
  return { kind: "paired", n, meanChange, t, df, p: twoTailedP(t, df), effectSize: meanChange / sd };
}

/** Welch's t-test on two independent groups. Needs 2+ answers in each. */
export function welchTest(pre: number[], post: number[]): TestResult | null {
  const a = summarize(pre);
  const b = summarize(post);
  if (a.n < 2 || b.n < 2 || a.mean === null || b.mean === null || a.sd === null || b.sd === null) return null;
  const meanChange = b.mean - a.mean;
  const va = a.sd ** 2 / a.n;
  const vb = b.sd ** 2 / b.n;
  const pooled = Math.sqrt(((a.n - 1) * a.sd ** 2 + (b.n - 1) * b.sd ** 2) / (a.n + b.n - 2));
  const n = Math.min(a.n, b.n);
  if (va + vb === 0) return { kind: "welch", n, meanChange, t: null, df: null, p: meanChange === 0 ? 1 : null, effectSize: null };
  const t = meanChange / Math.sqrt(va + vb);
  const df = (va + vb) ** 2 / (va ** 2 / (a.n - 1) + vb ** 2 / (b.n - 1));
  return { kind: "welch", n, meanChange, t, df, p: twoTailedP(t, df), effectSize: pooled ? meanChange / pooled : null };
}

/** How a result is usually described: negligible / small / medium / large (Cohen). */
export function effectLabel(effect: number | null): "negligible" | "small" | "medium" | "large" | null {
  if (effect === null) return null;
  const size = Math.abs(effect);
  if (size < 0.2) return "negligible";
  if (size < 0.5) return "small";
  if (size < 0.8) return "medium";
  return "large";
}

/** Two-tailed p-value for t with df degrees of freedom. */
export function twoTailedP(t: number, df: number): number {
  if (!Number.isFinite(t)) return 0;
  return Math.min(1, Math.max(0, regularizedBeta(df / (df + t * t), df / 2, 0.5)));
}

// ───────── Special functions (Numerical Recipes, 3rd ed., §6.1 and §6.4) ─────────

function logGamma(x: number): number {
  const c = [57.1562356658629235, -59.5979603554754912, 14.1360979747417471, -0.491913816097620199, 0.339946499848118887e-4,
    0.465236289270485756e-4, -0.983744753048795646e-4, 0.158088703224912494e-3, -0.210264441724104883e-3, 0.217439618115212643e-3,
    -0.164318106536763890e-3, 0.844182239838527433e-4, -0.261908384015814087e-4, 0.368991826595316234e-5];
  let y = x;
  const tmp = x + 5.2421875;
  const base = (x + 0.5) * Math.log(tmp) - tmp;
  let ser = 0.999999999999997092;
  for (const coefficient of c) ser += coefficient / ++y;
  return base + Math.log((2.5066282746310005 * ser) / x);
}

/** Regularized incomplete beta function I_x(a, b). */
export function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (front * betaFraction(x, a, b)) / a : 1 - (front * betaFraction(1 - x, b, a)) / b;
}

function betaFraction(x: number, a: number, b: number): number {
  const tiny = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) break;
  }
  return h;
}
