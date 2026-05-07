"use client";

import { StatCard } from "@/components/shared/stat-card";
import { formatYen } from "@/lib/utils/currency";
import {
  overdueInvoices,
  overdueInvoiceTotal,
  paidInvoiceTotal,
  unpaidInvoices,
  unpaidInvoiceTotal,
} from "@/lib/utils/aggregations";
import type { Invoice } from "@/lib/types/invoice";

type InvoiceSummaryCardsProps = {
  invoices: Invoice[];
};

export function InvoiceSummaryCards({ invoices }: InvoiceSummaryCardsProps) {
  const unpaid = unpaidInvoices(invoices);
  const unpaidTotal = unpaidInvoiceTotal(invoices);
  const paidTotal = paidInvoiceTotal(invoices);
  const overdue = overdueInvoices(invoices);
  const overdueTotal = overdueInvoiceTotal(invoices);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="未入金"
        value={formatYen(unpaidTotal)}
        sub={`${unpaid.length} 件`}
        tone="accent"
      />
      <StatCard
        label="入金済"
        value={formatYen(paidTotal)}
        sub="累計"
        tone="success"
      />
      <StatCard
        label="期限超過"
        value={
          <span className="text-red-600">{formatYen(overdueTotal)}</span>
        }
        sub={
          overdue.length > 0 ? (
            <span className="font-medium text-red-600">
              ⚠ {overdue.length} 件期限超過
            </span>
          ) : (
            "なし"
          )
        }
        tone="warn"
      />
    </div>
  );
}
