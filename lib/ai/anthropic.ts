import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { Anthropic as PostHogAnthropic } from "@posthog/ai/anthropic";
import { getPostHogClient } from "@/lib/observability/analytics";
import { AIOutputError, type AIProvider, type GenerateRequest, type GenerateResult } from "./provider";

/**
 * Claude via the official SDK, with structured outputs validated against the caller's schema.
 * `fallbacks: "default"` lets the API retry a request its safety classifiers decline on a
 * suitable fallback model, instead of failing the batch.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private readonly client?: Anthropic;
  private readonly posthogClient?: PostHogAnthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    const posthog = getPostHogClient();
    if (posthog) {
      this.posthogClient = new PostHogAnthropic({ apiKey, maxRetries: 2, timeout: 120_000, posthog });
    } else {
      // AI remains available when optional PostHog configuration is absent.
      this.client = new Anthropic({ apiKey, maxRetries: 2, timeout: 120_000 });
    }
  }

  async generate<T>(request: GenerateRequest<T>): Promise<GenerateResult<T>> {
    const options = {
      model: this.model,
      max_tokens: request.maxTokens,
      betas: ["server-side-fallback-2026-07-01"] as ["server-side-fallback-2026-07-01"],
      fallbacks: "default" as const,
      system: [{ type: "text" as const, text: request.system, cache_control: { type: "ephemeral" as const } }],
      messages: [{ role: "user" as const, content: request.prompt }],
      output_config: { effort: request.effort, format: betaZodOutputFormat(request.schema) },
    };
    const observability = request.observability;
    const response = this.posthogClient
      ? await this.posthogClient.beta.messages.parse({
          ...options,
          ...(observability
            ? {
                ...(observability.distinctId ? { posthogDistinctId: observability.distinctId } : {}),
                posthogTraceId: observability.traceId,
                posthogProperties: { $ai_session_id: observability.sessionId },
              }
            : {}),
        })
      : await this.client!.beta.messages.parse(options);
    if (response.stop_reason === "refusal") throw new AIOutputError(`Declined: ${response.stop_details?.category ?? "unknown"}`);
    if (response.stop_reason === "max_tokens") throw new AIOutputError("Output was cut off");
    const parsed = request.schema.safeParse(response.parsed_output);
    if (!parsed.success) throw new AIOutputError("Output didn't match the schema");
    return { data: parsed.data, model: response.model };
  }
}
