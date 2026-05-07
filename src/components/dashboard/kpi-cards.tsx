"use client";

import Link from "next/link";
import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import {
  totalRevenueThisMonth,
  totalRevenueLastMonth,
  unpaidInvoiceTotal,
  unpaidInvoices,
  overdueInvoices,
  activePipeline,
  avgPipelineProbability,
  newCustomersThisMonth,
} from "@/lib/utils/aggregations";
import { formatYen } from "@/lib/utils/currency";
import { StatCard } from "@/components/shared/stat-card";

function trendArrow(diff: number) {
  if (diff > 0) return "↑";
  if (diff < 0) return "↓";
  return "→";
}

export function KpiCards() {
  const customers = useCustomersStore((s) => s.customers);
  const deals = useDealsStore((s) => s.deals);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);

  const thisMonth = totalRevenueThisMonth(payments);
  const lastMonth = totalRevenueLastMonth(payments);
  const diff =
    lastMonth === 0
      ? thisMonth > 0
        ? 100
        : 0
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  const unpaid = unpaidInvoiceTotal(invoices);
  const overdueCount = overdueInvoices(invoices).length;

  const pipeline = activePipeline(deals);
  const avgProb = avgPipelineProbability(deals);

  const newCustomers = newCustomersThisMonth(customers).length;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Link href="/invoices?status=paid&period=current-month" className="block">
        <StatCard
          label="今月売上"
          value={formatYen(thisMonth)}
          sub={
            <span>
              前月比 {trendArrow(diff)}{" "}
              <span
                className={
                  diff > 0
                    ? "text-[var(--color-cyan-700)]"
                    : diff < 0
                      ? "text-red-600"
                      : "text-[var(--color-ink-500)]"
                }
              >
                {diff >= 0 ? "+" : ""}
                {diff}%
              </span>
              （先月 {formatYen(lastMonth)}）
            </span>
          }
        />
      </Link>
      <Link href="/invoices" className="block">
        <StatCard
          label="未入金"
          value={formatYen(unpaid)}
          sub={
            <span>
              {unpaidInvoices(invoices).length}件
              {overdueCount > 0 && (
                <span className="ml-2 text-red-600">
                  ⚠ {overdueCount}件期限超過
                </span>
              )}
            </span>
          }
          tone={overdueCount > 0 ? "warn" : "default"}
        />
      </Link>
      <Link href="/deals" className="block">
        <StatCard
          label="商談中"
          value={`${pipeline.length}件`}
          sub={`平均確度 ${avgProb}% / 想定 ${formatYen(
            pipeline.reduce((s, d) => s + d.amount, 0),
          )}`}
        />
      </Link>
      <Link href="/customers" className="block">
        <StatCard
          label="新規顧客（今月）"
          value={`${newCustomers}社`}
          sub="createdAt が当月のもの"
        />
      </Link>
    </div>
  );
}
