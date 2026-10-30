import "server-only";
import type { z } from "zod";
import { serverEnv } from "@/lib/env/server";

/**
 * A replaceable AI backend (spec §19). Callers describe the output with a Zod schema and get
 * validated data back; nothing else in the app knows which provider or model is used.
 */
export type GenerateRequest<T> = {
  /** Which job this is: for logs, and so the development stand-in knows what to return. */
  task: "analyze_comments" | "weekly_summary";
  /** Stable instructions. Keep variable data out of it so prompt caching can work. */
  system: string;
  /** The task and its data. */
  prompt: string;
  schema: z.ZodType<T>;
  /** Classification-style work needs little reasoning; summaries a bit more. */
  effort: "low" | "medium" | "high";
  maxTokens: number;
};

export type GenerateResult<T> = { data: T; model: string };

export interface AIProvider {
  readonly name: string;
  generate<T>(request: GenerateRequest<T>): Promise<GenerateResult<T>>;
}

/** The provider declined (safety) or returned something that doesn't match the schema. */
export class AIOutputError extends Error {}

/** The configured provider, or null when AI isn't set up (features then stay hidden). */
export async function getAIProvider(): Promise<AIProvider | null> {
  if (serverEnv.AI_PROVIDER === "fake") {
    // Never in staging or production: it doesn't really read the comments.
    if (serverEnv.APP_ENV !== "development") return null;
    const { FakeProvider } = await import("./fake");
    return new FakeProvider();
  }
  if (serverEnv.AI_PROVIDER === "anthropic" || (!serverEnv.AI_PROVIDER && serverEnv.ANTHROPIC_API_KEY)) {
    if (!serverEnv.ANTHROPIC_API_KEY) return null;
    const { AnthropicProvider } = await import("./anthropic");
    return new AnthropicProvider(serverEnv.ANTHROPIC_API_KEY, serverEnv.AI_MODEL ?? "claude-opus-5-5");
  }
  return null;
}

/** Whether AI features can run, without loading a provider. */
export const isAIConfigured = () =>
  (serverEnv.AI_PROVIDER === "fake" && serverEnv.APP_ENV === "development") ||
  (serverEnv.AI_PROVIDER !== "fake" && Boolean(serverEnv.ANTHROPIC_API_KEY));
