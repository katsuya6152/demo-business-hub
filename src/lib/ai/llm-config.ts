import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LlmProvider = "offline" | "anthropic" | "openai";

export const LLM_PROVIDER_LABELS: Record<LlmProvider, string> = {
  offline: "キーワードマッチング (オフライン)",
  anthropic: "Anthropic API",
  openai: "OpenAI API",
};

export const LLM_DEFAULT_MODELS: Record<LlmProvider, string> = {
  offline: "",
  anthropic: "claude-3-5-haiku-latest",
  openai: "gpt-4o-mini",
};

export type LlmConfig = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
};

type LlmConfigStore = {
  config: LlmConfig;
  setProvider: (provider: LlmProvider) => void;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  reset: () => void;
};

const DEFAULT_CONFIG: LlmConfig = {
  provider: "offline",
  apiKey: "",
  model: "",
};

export const useLlmConfigStore = create<LlmConfigStore>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      setProvider: (provider) =>
        set((s) => ({
          config: {
            ...s.config,
            provider,
            model:
              provider === s.config.provider && s.config.model
                ? s.config.model
                : LLM_DEFAULT_MODELS[provider],
          },
        })),
      setApiKey: (apiKey) =>
        set((s) => ({ config: { ...s.config, apiKey } })),
      setModel: (model) =>
        set((s) => ({ config: { ...s.config, model } })),
      reset: () => set({ config: DEFAULT_CONFIG }),
    }),
    { name: "business-hub-llm-config-v1" },
  ),
);

export function isLlmReady(config: LlmConfig): boolean {
  if (config.provider === "offline") return true;
  return Boolean(config.apiKey.trim());
}
