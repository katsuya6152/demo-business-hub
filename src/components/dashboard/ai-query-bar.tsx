"use client";

import { useState, type FormEvent } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import { type AiResponse } from "@/lib/ai/responder";
import { QUICK_QUESTIONS } from "@/lib/ai/patterns";
import {
  askLlm,
  LLM_STAGE_MESSAGES,
  type LlmStage,
} from "@/lib/ai/llm-client";
import {
  useLlmConfigStore,
  LLM_PROVIDER_LABELS,
} from "@/lib/ai/llm-config";
import { cn } from "@/lib/utils";

type HistoryItem = {
  query: string;
  response: AiResponse;
  at: number;
};

export function AiQueryBar() {
  const customers = useCustomersStore((s) => s.customers);
  const deals = useDealsStore((s) => s.deals);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);
  const llmConfig = useLlmConfigStore((s) => s.config);

  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<LlmStage>("matching");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const ask = async (input: string) => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setStage("matching");
    setResponse(null);

    const ctx = { customers, deals, invoices, payments };
    const res = await askLlm(input, {
      config: llmConfig,
      ctx,
      onStage: (s) => setStage(s),
    });
    setResponse(res);
    setHistory((prev) => [
      { query: input, response: res, at: Date.now() },
      ...prev.filter((h) => h.query !== input).slice(0, 4),
    ]);
    setLoading(false);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(query);
  };

  const onQuick = (q: string) => {
    setQuery(q);
    ask(q);
  };

  const providerLabel = LLM_PROVIDER_LABELS[llmConfig.provider];
  const isRemote = llmConfig.provider !== "offline" && llmConfig.apiKey.trim();

  return (
    <Card className="relative overflow-hidden border-[var(--color-accent-200)] bg-gradient-to-br from-[var(--color-accent-50)] via-card to-[var(--color-cyan-50)] p-5 ring-1 ring-[var(--color-accent-100)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--color-accent-100)] blur-3xl opacity-60" />
      <div className="relative flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-[var(--color-accent-200)]">
          <Sparkles className="h-4 w-4 text-[var(--color-accent-600)] animate-pulse" />
        </span>
        <p className="text-sm font-semibold text-[var(--color-ink-950)]">
          業務データに自然言語で質問
        </p>
        <span
          className={cn(
            "ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
            isRemote
              ? "bg-[var(--color-accent-100)] text-[var(--color-accent-700)]"
              : "bg-[var(--color-ink-100)] text-[var(--color-ink-500)]",
          )}
        >
          {providerLabel}
        </span>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="ml-auto text-xs text-[var(--color-accent-700)] underline-offset-2 hover:underline"
          >
            {showHistory ? "履歴を閉じる" : `履歴 (${history.length})`}
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例: 今月の売上は？ / 未入金一覧 / TOP顧客は？"
          className="h-12 bg-card text-base"
          disabled={loading}
          aria-label="AI への質問"
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 px-4"
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onQuick(q)}
            disabled={loading}
            className="text-xs"
            aria-label={`クイック質問: ${q}`}
          >
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer bg-card text-xs transition-colors",
                loading
                  ? "opacity-50"
                  : "hover:bg-[var(--color-accent-50)] hover:border-[var(--color-accent-600)] hover:text-[var(--color-accent-700)]",
              )}
            >
              {q}
            </Badge>
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-ink-500)]">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-accent-600)]" />
          <span className="animate-pulse">{LLM_STAGE_MESSAGES[stage]}</span>
        </div>
      )}

      {!loading && response && (
        <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-card p-4">
          <div className="prose prose-sm max-w-none text-[var(--color-ink-700)] prose-strong:text-[var(--color-ink-950)] prose-strong:font-semibold prose-li:my-0">
            <ReactMarkdown>{response.text}</ReactMarkdown>
          </div>
          {response.matched && (
            <p className="mt-2 text-[10px] text-[var(--color-ink-500)]">
              matched: {response.matched}
            </p>
          )}
        </div>
      )}

      {showHistory && history.length > 0 && (
        <div className="mt-4 space-y-2">
          {history.slice(0, 3).map((h) => (
            <details
              key={h.at}
              className="rounded-md border border-[var(--color-line)] bg-card p-3 text-sm"
            >
              <summary className="cursor-pointer text-[var(--color-ink-700)]">
                <span className="font-medium">Q.</span> {h.query}
                <span className="ml-2 text-xs text-[var(--color-ink-500)]">
                  {h.response.matched ?? "fallback"}
                </span>
              </summary>
              <div className="prose prose-sm mt-2 max-w-none text-[var(--color-ink-700)] prose-strong:text-[var(--color-ink-950)] prose-li:my-0">
                <ReactMarkdown>{h.response.text}</ReactMarkdown>
              </div>
            </details>
          ))}
        </div>
      )}
    </Card>
  );
}
