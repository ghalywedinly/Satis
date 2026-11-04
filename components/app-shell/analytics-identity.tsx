"use client";

import { useEffect } from "react";
import { identifyClient } from "@/lib/observability/client";

/** Associates analytics and error reports with the signed-in user's internal id. */
export function AnalyticsIdentity({ userId }: { userId: string }) {
  useEffect(() => identifyClient(userId), [userId]);
  return null;
}
