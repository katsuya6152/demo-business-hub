"use client";

import { useMemo } from "react";
import { Sparkles, AlertTriangle, TrendingUp, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import { buildInsights, pickHeadline, type Insight } from "@/lib/ai/insight";
import { useLlmConfigStore, LLM_PROVIDER_LABELS } from "@/lib/ai/llm-config";
import { cn } from "@/lib/utils";

const TONE_BADGE: Record<
  Insight["tone"],
  { icon: typeof Sparkles; bg: string; text: string; label: string }
> = {
  positive: {
    icon: TrendingUp,
    bg: "bg-[var(--color-cyan-50)]",
    text: "text-[var(--color-cyan-700)]",
    label: "好調",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "注意",
  },
  neutral: {
    icon: Info,
    bg: "bg-[var(--color-accent-50)]",
    text: "text-[var(--color-accent-700)]",
    label: "情報",
  },
};

export function AiInsightCard() {
  const customers = useCustomersStore((s) => s.customers);
  const deals = useDealsStore((s) => s.deals);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);
  const provider = useLlmConfigStore((s) => s.config.provider);

  const insights = useMemo(
    () => buildInsights({ customers, deals, invoices, payments }),
    [customers, deals, invoices, payments],
  );

  const headline = pickHeadline(insights);
  const Headline = TONE_BADGE[headline.tone];
  const HeadlineIcon = Headline.icon;

  return (
    <Card className="overflow-hidden border-[var(--color-accent-200)] bg-gradient-to-br from-[var(--color-accent-50)] via-white to-[var(--color-cyan-50)] p-5 ring-1 ring-[var(--color-accent-100)]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[var(--color-accent-200)]">
          <Sparkles className="h-4 w-4 text-[var(--color-accent-600)]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-ink-950)]">
              今日の注目
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                Headline.bg,
                Headline.text,
              )}
            >
              <HeadlineIcon className="h-3 w-3" />
              {Headline.label}
            </span>
            <span className="text-[10px] text-[var(--color-ink-500)]">
              {LLM_PROVIDER_LABELS[provider]} で生成
            </span>
          </div>
          <div className="prose prose-sm mt-2 max-w-none text-[var(--color-ink-700)] prose-strong:text-[var(--color-ink-950)] prose-strong:font-semibold prose-li:my-0.5 prose-ul:my-0">
            <ReactMarkdown>
              {insights.map((it) => `- ${it.text}`).join("\n")}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </Card>
  );
}
