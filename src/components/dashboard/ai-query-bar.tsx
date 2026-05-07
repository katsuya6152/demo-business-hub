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
import { generateResponse, type AiResponse } from "@/lib/ai/responder";
import { QUICK_QUESTIONS } from "@/lib/ai/patterns";
import { cn } from "@/lib/utils";

type HistoryItem = {
  query: string;
  response: AiResponse;
  at: number;
};

const LOADING_MESSAGES = [
  "質問を解析しています...",
  "データを集計しています...",
];

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function AiQueryBar() {
  const customers = useCustomersStore((s) => s.customers);
  const deals = useDealsStore((s) => s.deals);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);

  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const ask = async (input: string) => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setLoadingMessage(LOADING_MESSAGES[0]);
    setResponse(null);

    const stage1 = randomBetween(200, 400);
    const stage2 = randomBetween(400, 1000);
    await sleep(stage1);
    setLoadingMessage(LOADING_MESSAGES[1]);
    await sleep(stage2);

    const ctx = { customers, deals, invoices, payments };
    const res = generateResponse(input, ctx);
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

  return (
    <Card className="border-[var(--color-accent-200)] bg-gradient-to-br from-[var(--color-accent-50)] to-white p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[var(--color-accent-600)]" />
        <p className="text-sm font-semibold text-[var(--color-ink-950)]">
          業務データに自然言語で質問できます
        </p>
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
          className="h-12 bg-white text-base"
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
                "cursor-pointer bg-white text-xs transition-colors",
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
          <span className="animate-pulse">{loadingMessage}</span>
        </div>
      )}

      {!loading && response && (
        <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-white p-4">
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
              className="rounded-md border border-[var(--color-line)] bg-white p-3 text-sm"
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
