"use client";

import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { useInvoicesStore } from "@/lib/store/invoices";
import { useQuotesStore } from "@/lib/store/quotes";
import { usePaymentsStore } from "@/lib/store/payments";
import { StatCard } from "@/components/shared/stat-card";
import { useIndustry } from "@/hooks/use-industry";
import { INDUSTRY_LABELS } from "@/lib/types/industry";

export function DashboardPlaceholder() {
  const customers = useCustomersStore((s) => s.customers);
  const deals = useDealsStore((s) => s.deals);
  const quotes = useQuotesStore((s) => s.quotes);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);
  const industry = useIndustry();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
          ダッシュボード
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          {INDUSTRY_LABELS[industry]} ・ Phase 2 で本実装します
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <StatCard label="顧客" value={customers.length} sub="件" />
        <StatCard label="案件" value={deals.length} sub="件" />
        <StatCard label="見積" value={quotes.length} sub="件" />
        <StatCard label="請求" value={invoices.length} sub="件" />
        <StatCard label="入金" value={payments.length} sub="件" />
      </div>

      <div className="rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-bg-soft)] p-6 text-sm text-[var(--color-ink-500)]">
        Phase 1 完了。次フェーズで KPIカード / 売上推移グラフ / AI問い合わせバー / 直近の動き が入ります。
      </div>
    </div>
  );
}
