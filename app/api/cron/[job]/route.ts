import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env/server";
import { reportError } from "@/lib/observability/errors";
import { analyzePending, generateWeeklySummaries } from "@/modules/ai/jobs";
import { sendWeeklyReports } from "@/modules/notifications/weekly";

// AI calls can take a while; Vercel stops the function at this limit.
export const maxDuration = 60;

const JOBS = {
  // Daily: analyse new comments, oldest first.
  "ai-analyze": () => analyzePending({ limit: 120 }),
  // Sunday morning (Riyadh): analyse what's left, summarise the week, then email each team its report.
  // The report goes out even when AI isn't set up; it just has no AI summary then.
  "ai-weekly-summary": async () => {
    const analyze = await analyzePending({ limit: 80 });
    const summaries = await generateWeeklySummaries();
    const reports = await sendWeeklyReports();
    return { analyze, summaries, reports };
  },
} as const;

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Anything else is turned away. */
function authorized(request: Request) {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request, { params }: RouteContext<"/api/cron/[job]">) {
  const { job } = await params;
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(job in JOBS)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const result = await JOBS[job as keyof typeof JOBS]();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    reportError(error, { area: "cron", action: job });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
