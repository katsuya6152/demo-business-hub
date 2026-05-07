import { generateResponse, type AiContext, type AiResponse } from "./responder";
import {
  LLM_PROVIDER_LABELS,
  type LlmConfig,
  type LlmProvider,
} from "./llm-config";

export type LlmStage =
  | "matching"
  | "aggregating"
  | "calling-llm"
  | "formatting";

export const LLM_STAGE_MESSAGES: Record<LlmStage, string> = {
  matching: "質問を解析しています...",
  aggregating: "データを集計しています...",
  "calling-llm": "LLM 経由で回答中...",
  formatting: "回答を整形しています...",
};

export type LlmAskOptions = {
  config: LlmConfig;
  ctx: AiContext;
  onStage?: (stage: LlmStage) => void;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Call a remote LLM provider. In demo mode we do not actually hit the network —
 * we just simulate latency and append a provider tag to the offline response so
 * the user can verify the routing works.
 *
 * If a real fetch is desired, swap `simulateLlm` for an actual `fetch` call to
 * `https://api.anthropic.com/v1/messages` (Anthropic) or
 * `https://api.openai.com/v1/chat/completions` (OpenAI). The demo intentionally
 * avoids network calls so the bundled experience stays self-contained and
 * never leaks API keys from the browser.
 */
async function simulateLlm(
  provider: Exclude<LlmProvider, "offline">,
  baseResponse: AiResponse,
  config: LlmConfig,
): Promise<AiResponse> {
  await sleep(rand(800, 1600));
  const tag = `${LLM_PROVIDER_LABELS[provider]}${
    config.model ? ` / ${config.model}` : ""
  }`;
  const suffix = `\n\n_（${tag} 経由で生成）_`;
  return {
    matched: baseResponse.matched,
    text: baseResponse.text + suffix,
  };
}

/**
 * Ask the AI a question, routing through the configured provider.
 * Stages emit progress for the UI.
 */
export async function askLlm(
  input: string,
  options: LlmAskOptions,
): Promise<AiResponse> {
  const { config, ctx, onStage } = options;

  onStage?.("matching");
  await sleep(rand(200, 400));

  onStage?.("aggregating");
  await sleep(rand(300, 700));

  const baseResponse = generateResponse(input, ctx);

  if (config.provider === "offline" || !config.apiKey.trim()) {
    onStage?.("formatting");
    await sleep(rand(150, 300));
    return baseResponse;
  }

  onStage?.("calling-llm");
  const remote = await simulateLlm(config.provider, baseResponse, config);

  onStage?.("formatting");
  await sleep(rand(150, 300));
  return remote;
}

/**
 * Pretend to verify the API key against the provider. This never makes a real
 * network request — it just inspects the local config. Returns true if the
 * config looks "ready" for the chosen provider.
 */
export async function testLlmConnection(config: LlmConfig): Promise<boolean> {
  await sleep(rand(400, 900));
  if (config.provider === "offline") return true;
  return Boolean(config.apiKey.trim());
}
