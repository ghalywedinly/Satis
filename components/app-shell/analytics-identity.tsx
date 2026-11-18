"use client";

import { useEffect } from "react";
import { identifyClient } from "@/lib/observability/client";

/** Associates analytics and error reports with the signed-in user's internal id. */
export function AnalyticsIdentity({ userId, email, name }: { userId: string; email?: string; name?: string }) {
  useEffect(() => identifyClient(userId, { email, name }), [userId, email, name]);
  return null;
}
