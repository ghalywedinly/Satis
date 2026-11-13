"use client";

import { useEffect } from "react";
import { identifyClient } from "@/lib/observability/client";

/** Associates analytics and error reports with the signed-in user's internal id. */
export function AnalyticsIdentity({ userId, email }: { userId: string; email: string | null }) {
  useEffect(() => identifyClient(userId, email), [userId, email]);
  return null;
}
