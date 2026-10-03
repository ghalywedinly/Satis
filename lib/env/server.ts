import "server-only";
import { publicEnv } from "./public";
import { requiredInDeployedEnvs, serverEnvSchema } from "./schema";

export const serverEnv = serverEnvSchema.parse(process.env);

/**
 * Called once at server start (instrumentation.ts). Staging and production refuse to boot with
 * missing configuration instead of failing later on a customer's request.
 */
export function assertDeployedEnv() {
  if (serverEnv.APP_ENV === "development") return;
  if (serverEnv.RATE_LIMIT_DISABLED || serverEnv.EMAIL_OUTBOX_DIR) {
    throw new Error("RATE_LIMIT_DISABLED and EMAIL_OUTBOX_DIR are development-only settings.");
  }
  const values: Record<string, unknown> = { ...publicEnv, ...serverEnv };
  const missing = requiredInDeployedEnvs.filter((key) => !values[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables for ${serverEnv.APP_ENV}: ${missing.join(", ")}`);
  }
}
