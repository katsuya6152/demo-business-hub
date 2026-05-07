import { format, parseISO } from "date-fns";
import type { Customer } from "@/lib/types/customer";
import type { Deal } from "@/lib/types/deal";
import type { Invoice } from "@/lib/types/invoice";
import type { Payment } from "@/lib/types/payment";
import { DEAL_STAGE_LABELS } from "@/lib/types/deal";
import { formatYen } from "@/lib/utils/currency";
import { daysBetween } from "@/lib/utils/date";
import {
  totalRevenueThisMonth,
  totalRevenueLastMonth,
  unpaidInvoices,
  unpaidInvoiceTotal,
  overdueInvoices,
  overdueInvoiceTotal,
  upcomingInvoices,
  monthlyRevenue,
  activePipeline,
  avgPipelineProbability,
  pipelineTotal,
  wonDealsThisMonth,
  lostDeals,
  highProbabilityDeals,
  dealsClosingNextMonth,
  largestDeal,
  avgDealAmount,
  winRate,
  topCustomersByRevenue,
  newCustomersThisMonth,
  dormantCustomers,
  customerStatusBreakdown,
} from "@/lib/utils/aggregations";
import { matchPattern } from "./matcher";
import type { QuestionPatternId } from "./patterns";

export type AiContext = {
  customers: Customer[];
  deals: Deal[];
  invoices: Invoice[];
  payments: Payment[];
};

export type AiResponse = {
  matched: QuestionPatternId | null;
  text: string;
};

const FALLBACK = `すみません、その質問にはまだ対応していません。

以下のような質問が答えられます：
- 今月の売上は？
- 未入金一覧を教えて
- 商談中の案件は？
- TOP顧客は？
- 新規顧客
- 成約率

または、サイドメニューから直接データをご覧ください。`;

function arrow(diff: number): string {
  if (diff > 0) return "↑";
  if (diff < 0) return "↓";
  return "→";
}

function customerName(customers: Customer[], id: string): string {
  return customers.find((c) => c.id === id)?.name ?? "(顧客不明)";
}

export function generateResponse(input: string, ctx: AiContext): AiResponse {
  const pattern = matchPattern(input);
  if (!pattern) return { matched: null, text: FALLBACK };

  const id = pattern.id;

  switch (id) {
    case "Q01": {
      const t = totalRevenueThisMonth(ctx.payments);
      const l = totalRevenueLastMonth(ctx.payments);
      const diff =
        l === 0 ? (t > 0 ? 100 : 0) : Math.round(((t - l) / l) * 100);
      if (t === 0) {
        return {
          matched: id,
          text: "今月の入金データがまだありません。",
        };
      }
      return {
        matched: id,
        text: `今月の入金合計は **${formatYen(t)}** です。\n前月比 ${arrow(diff)} **${diff >= 0 ? "+" : ""}${diff}%**（先月 ${formatYen(l)}）。`,
      };
    }

    case "Q02": {
      const l = totalRevenueLastMonth(ctx.payments);
      if (l === 0) {
        return { matched: id, text: "先月の入金データがありません。" };
      }
      return {
        matched: id,
        text: `先月の入金合計は **${formatYen(l)}** でした。`,
      };
    }

    case "Q03": {
      const items = unpaidInvoices(ctx.invoices);
      const total = unpaidInvoiceTotal(ctx.invoices);
      if (items.length === 0) {
        return {
          matched: id,
          text: "すべての請求書が入金済みです。良好な状態です！",
        };
      }
      const top5 = [...items]
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      const lines = top5
        .map(
          (inv) =>
            `- ${customerName(ctx.customers, inv.customerId)}: **${formatYen(inv.total)}**（期限 ${format(parseISO(inv.dueDate), "yyyy-MM-dd")}）`,
        )
        .join("\n");
      const more =
        items.length > 5 ? `\n\n他 ${items.length - 5}件あります。` : "";
      return {
        matched: id,
        text: `未入金の請求書は **${items.length}件・合計${formatYen(total)}** です。\n\n主な未入金（上位5件）：\n${lines}${more}`,
      };
    }

    case "Q04": {
      const items = overdueInvoices(ctx.invoices);
      const total = overdueInvoiceTotal(ctx.invoices);
      if (items.length === 0) {
        return {
          matched: id,
          text: "期限超過の請求書はありません。良好な入金管理です。",
        };
      }
      const today = new Date().toISOString();
      const sorted = [...items].sort((a, b) =>
        a.dueDate < b.dueDate ? -1 : 1,
      );
      const oldestDays = daysBetween(sorted[0].dueDate, today);
      const lines = sorted
        .slice(0, 5)
        .map((inv) => {
          const days = daysBetween(inv.dueDate, today);
          return `- ${customerName(ctx.customers, inv.customerId)}: **${formatYen(inv.total)}**（期限 ${format(parseISO(inv.dueDate), "yyyy-MM-dd")} → **${days}日超過**）`;
        })
        .join("\n");
      return {
        matched: id,
        text: `期限超過は **${items.length}件・合計${formatYen(total)}** です。最も古いのは **${oldestDays}日経過** しています。\n\n至急対応が必要な請求書：\n${lines}`,
      };
    }

    case "Q05": {
      const items = upcomingInvoices(ctx.invoices);
      if (items.length === 0) {
        return {
          matched: id,
          text: "来月の入金予定はありません。",
        };
      }
      const total = items.reduce((s, i) => s + i.total, 0);
      const lines = items
        .map(
          (inv) =>
            `- ${customerName(ctx.customers, inv.customerId)}: **${formatYen(inv.total)}**（期限 ${format(parseISO(inv.dueDate), "yyyy-MM-dd")}）`,
        )
        .join("\n");
      return {
        matched: id,
        text: `来月の入金予定は **${items.length}件・${formatYen(total)}** です。\n\n${lines}`,
      };
    }

    case "Q06": {
      const data = monthlyRevenue(ctx.payments, 6);
      const lines = data
        .map((row) => `- ${row.month}: **${formatYen(row.amount)}**`)
        .join("\n");
      return {
        matched: id,
        text: `直近6ヶ月の売上推移：\n\n${lines}`,
      };
    }

    case "Q07": {
      const items = activePipeline(ctx.deals);
      if (items.length === 0) {
        return {
          matched: id,
          text: "現在商談中の案件はありません。",
        };
      }
      const total = pipelineTotal(ctx.deals);
      const avgProb = avgPipelineProbability(ctx.deals);
      const top5 = [...items]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      const lines = top5
        .map(
          (d) =>
            `- ${customerName(ctx.customers, d.customerId)} / ${d.title}: **${formatYen(d.amount)}**（確度 ${d.probability}% / ${DEAL_STAGE_LABELS[d.stage]}）`,
        )
        .join("\n");
      return {
        matched: id,
        text: `商談中は **${items.length}件・想定売上${formatYen(total)}**、平均確度 **${avgProb}%** です。\n\n進行中の案件（上位5件）：\n${lines}`,
      };
    }

    case "Q08": {
      const items = wonDealsThisMonth(ctx.deals);
      if (items.length === 0) {
        return {
          matched: id,
          text: "今月の受注はまだありません。今月もがんばりましょう！",
        };
      }
      const total = items.reduce((s, d) => s + d.amount, 0);
      const lines = items
        .map(
          (d) =>
            `- ${customerName(ctx.customers, d.customerId)} / ${d.title}: **${formatYen(d.amount)}**（クローズ ${d.closedAt ? format(parseISO(d.closedAt), "yyyy-MM-dd") : "—"}）`,
        )
        .join("\n");
      return {
        matched: id,
        text: `今月の受注は **${items.length}件・${formatYen(total)}** です。\n\n受注した案件：\n${lines}\n\nおめでとうございます！素晴らしい月ですね。`,
      };
    }

    case "Q09": {
      const items = lostDeals(ctx.deals);
      if (items.length === 0) {
        return { matched: id, text: "失注した案件はありません。" };
      }
      const total = items.reduce((s, d) => s + d.amount, 0);
      const reasons = new Map<string, number>();
      items.forEach((d) => {
        const r = d.lostReason ?? "理由未記入";
        reasons.set(r, (reasons.get(r) ?? 0) + 1);
      });
      const reasonLines = Array.from(reasons.entries())
        .map(([r, c]) => `- ${r}: ${c}件`)
        .join("\n");
      return {
        matched: id,
        text: `失注は **${items.length}件・${formatYen(total)}** です。\n\n失注理由の内訳：\n${reasonLines}`,
      };
    }

    case "Q10": {
      const items = highProbabilityDeals(ctx.deals, 70);
      if (items.length === 0) {
        return {
          matched: id,
          text: "確度70%以上の案件はありません。",
        };
      }
      const lines = items
        .slice(0, 5)
        .map(
          (d) =>
            `- ${customerName(ctx.customers, d.customerId)} / ${d.title}: **${formatYen(d.amount)}**（確度 ${d.probability}%）`,
        )
        .join("\n");
      return {
        matched: id,
        text: `確度70%以上の案件は **${items.length}件** です。\n\n${lines}`,
      };
    }

    case "Q11": {
      const items = dealsClosingNextMonth(ctx.deals);
      if (items.length === 0) {
        return {
          matched: id,
          text: "来月クローズ予定の案件はありません。",
        };
      }
      const total = items.reduce((s, d) => s + d.amount, 0);
      const lines = items
        .map(
          (d) =>
            `- ${customerName(ctx.customers, d.customerId)} / ${d.title}: **${formatYen(d.amount)}**（${format(parseISO(d.expectedCloseDate), "yyyy-MM-dd")}）`,
        )
        .join("\n");
      return {
        matched: id,
        text: `来月クローズ予定は **${items.length}件・想定${formatYen(total)}** です。\n\n${lines}`,
      };
    }

    case "Q12": {
      const d = largestDeal(ctx.deals);
      if (!d) {
        return { matched: id, text: "案件がありません。" };
      }
      return {
        matched: id,
        text: `最大の進行中案件は **${customerName(ctx.customers, d.customerId)} の ${d.title}（${formatYen(d.amount)}）** です。\n\n- ステージ: ${DEAL_STAGE_LABELS[d.stage]}\n- 確度: ${d.probability}%\n- 予想クローズ: ${format(parseISO(d.expectedCloseDate), "yyyy-MM-dd")}`,
      };
    }

    case "Q13": {
      const top = topCustomersByRevenue(
        ctx.customers,
        ctx.payments,
        ctx.invoices,
        3,
      );
      if (top.length === 0) {
        return { matched: id, text: "顧客の入金実績がまだありません。" };
      }
      const totalAll = ctx.payments.reduce((s, p) => s + p.amount, 0);
      const top3Sum = top.reduce((s, x) => s + x.revenue, 0);
      const percent =
        totalAll === 0 ? 0 : Math.round((top3Sum / totalAll) * 100);
      const lines = top
        .map(
          (row, idx) =>
            `${idx + 1}. **${row.customer.name}**: ${formatYen(row.revenue)}`,
        )
        .join("\n");
      return {
        matched: id,
        text: `累積入金額のTOP3：\n\n${lines}\n\nこの3社で全体の約 **${percent}%** を占めています。`,
      };
    }

    case "Q14": {
      const items = newCustomersThisMonth(ctx.customers);
      if (items.length === 0) {
        return {
          matched: id,
          text: "今月の新規顧客はまだありません。",
        };
      }
      const lines = items
        .map((c) => `- ${c.name}（業種: ${c.industry || "—"}）`)
        .join("\n");
      return {
        matched: id,
        text: `今月の新規顧客は **${items.length}社** です。\n\n${lines}\n\n関係構築をしっかり進めていきましょう！`,
      };
    }

    case "Q15": {
      const items = dormantCustomers(ctx.customers, ctx.invoices);
      if (items.length === 0) {
        return { matched: id, text: "全顧客が直近6ヶ月以内に取引があります。" };
      }
      const lines = items
        .slice(0, 10)
        .map((c) => `- ${c.name}`)
        .join("\n");
      return {
        matched: id,
        text: `直近6ヶ月で取引のない顧客は **${items.length}社** です。\n\n${lines}`,
      };
    }

    case "Q16": {
      const total = ctx.customers.length;
      const breakdown = customerStatusBreakdown(ctx.customers);
      return {
        matched: id,
        text: `総顧客数 **${total}社** です。\n\n内訳：\n- アクティブ: ${breakdown.active}社\n- 見込み客: ${breakdown.prospect}社\n- 非アクティブ: ${breakdown.inactive}社`,
      };
    }

    case "Q17": {
      const avg = avgDealAmount(ctx.deals);
      return {
        matched: id,
        text: `平均案件金額：\n\n- 全案件: **${formatYen(avg.all)}**\n- 受注済み: **${formatYen(avg.won)}**`,
      };
    }

    case "Q18": {
      const wr = winRate(ctx.deals);
      if (wr.total === 0) {
        return {
          matched: id,
          text: "受注/失注の確定案件がありません。",
        };
      }
      return {
        matched: id,
        text: `直近の成約率は **${wr.rate}%** です。\n\n（受注 ${wr.won}件 / 失注 ${wr.lost}件 / 計 ${wr.total}件）`,
      };
    }

    default:
      return { matched: null, text: FALLBACK };
  }
}
