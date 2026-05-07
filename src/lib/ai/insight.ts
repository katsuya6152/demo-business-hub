import type { AiContext } from "./responder";
import { formatYen } from "@/lib/utils/currency";
import {
  totalRevenueThisMonth,
  totalRevenueLastMonth,
  overdueInvoices,
  overdueInvoiceTotal,
  unpaidInvoices,
  activePipeline,
  pipelineTotal,
  highProbabilityDeals,
  wonDealsThisMonth,
  newCustomersThisMonth,
  dealsClosingNextMonth,
} from "@/lib/utils/aggregations";

export type InsightTone = "positive" | "warning" | "neutral";

export type Insight = {
  id: string;
  tone: InsightTone;
  text: string;
};

function pct(numer: number, denom: number): number {
  if (denom === 0) return numer > 0 ? 100 : 0;
  return Math.round(((numer - denom) / denom) * 100);
}

/**
 * Produce a short list of human-readable highlights from the current data.
 * The first item drives the headline summary; the full list is used as the
 * markdown body of the dashboard insight card.
 */
export function buildInsights(ctx: AiContext): Insight[] {
  const insights: Insight[] = [];

  // Revenue (this month vs last month)
  const tm = totalRevenueThisMonth(ctx.payments);
  const lm = totalRevenueLastMonth(ctx.payments);
  if (tm > 0 || lm > 0) {
    const diff = pct(tm, lm);
    if (tm === 0 && lm > 0) {
      insights.push({
        id: "revenue",
        tone: "warning",
        text: `今月の入金は **¥0**（先月 ${formatYen(lm)}）。月次目標とのギャップを確認しましょう。`,
      });
    } else if (diff >= 10) {
      insights.push({
        id: "revenue",
        tone: "positive",
        text: `今月の売上は **${formatYen(tm)}** で前月比 **+${diff}%** と好調です。`,
      });
    } else if (diff <= -10) {
      insights.push({
        id: "revenue",
        tone: "warning",
        text: `今月の売上は **${formatYen(tm)}** で前月比 **${diff}%** と減速気味。停滞している商談を見直しましょう。`,
      });
    } else {
      insights.push({
        id: "revenue",
        tone: "neutral",
        text: `今月の売上は **${formatYen(tm)}**（前月比 ${diff >= 0 ? "+" : ""}${diff}%）と前月並みのペースです。`,
      });
    }
  }

  // Overdue invoices
  const overdue = overdueInvoices(ctx.invoices);
  if (overdue.length > 0) {
    const total = overdueInvoiceTotal(ctx.invoices);
    insights.push({
      id: "overdue",
      tone: "warning",
      text: `期限超過の請求が **${overdue.length} 件・${formatYen(total)}** 残っています。督促メール下書き機能で素早く対応できます。`,
    });
  }

  // Unpaid (sent) invoices
  const unpaid = unpaidInvoices(ctx.invoices);
  if (unpaid.length > 0 && overdue.length === 0) {
    const total = unpaid.reduce((s, i) => s + i.total, 0);
    insights.push({
      id: "unpaid",
      tone: "neutral",
      text: `未入金の請求は **${unpaid.length} 件・${formatYen(total)}** あります。期日管理は順調です。`,
    });
  }

  // Pipeline
  const active = activePipeline(ctx.deals);
  const pipeline = pipelineTotal(ctx.deals);
  const hot = highProbabilityDeals(ctx.deals, 70);
  if (active.length > 0) {
    if (hot.length > 0) {
      const hotTotal = hot.reduce((s, d) => s + d.amount, 0);
      insights.push({
        id: "pipeline-hot",
        tone: "positive",
        text: `商談中 **${active.length} 件** のうち確度 70% 以上が **${hot.length} 件**。受注見込み総額は **${formatYen(hotTotal)}** です。`,
      });
    } else {
      insights.push({
        id: "pipeline",
        tone: "neutral",
        text: `商談中は **${active.length} 件・想定 ${formatYen(pipeline)}** です。クローズ率を高める施策を検討しましょう。`,
      });
    }
  }

  // Closing next month
  const closingNext = dealsClosingNextMonth(ctx.deals);
  if (closingNext.length > 0) {
    const total = closingNext.reduce((s, d) => s + d.amount, 0);
    insights.push({
      id: "closing-next",
      tone: "neutral",
      text: `来月クローズ予定の案件が **${closingNext.length} 件・${formatYen(total)}** 控えています。`,
    });
  }

  // Won deals this month
  const wonTm = wonDealsThisMonth(ctx.deals);
  if (wonTm.length > 0) {
    const total = wonTm.reduce((s, d) => s + d.amount, 0);
    insights.push({
      id: "won",
      tone: "positive",
      text: `今月の受注 **${wonTm.length} 件・${formatYen(total)}**。素晴らしい成果です。`,
    });
  }

  // New customers
  const newCustomers = newCustomersThisMonth(ctx.customers);
  if (newCustomers.length > 0) {
    insights.push({
      id: "new-customers",
      tone: "positive",
      text: `今月の新規顧客は **${newCustomers.length} 社**。継続フォローで商談化につなげましょう。`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "empty",
      tone: "neutral",
      text: "現在強調すべきハイライトはありません。データを追加すると自動的に要約が表示されます。",
    });
  }

  return insights;
}

export function buildInsightMarkdown(ctx: AiContext): string {
  const insights = buildInsights(ctx);
  return insights.map((it) => `- ${it.text}`).join("\n");
}

export function pickHeadline(insights: Insight[]): Insight {
  return (
    insights.find((i) => i.tone === "warning") ??
    insights.find((i) => i.tone === "positive") ??
    insights[0]
  );
}
