"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import { formatYen } from "@/lib/utils/currency";
import { fmtDate } from "@/lib/utils/date";

type ActivityItem = {
  date: string;
  kind: "payment" | "deal" | "invoice";
  text: string;
  href: string;
};

export function RecentActivity() {
  const customers = useCustomersStore((s) => s.customers);
  const deals = useDealsStore((s) => s.deals);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);

  const customerNameById = new Map(customers.map((c) => [c.id, c.name]));
  const invoiceById = new Map(invoices.map((i) => [i.id, i]));

  const items: ActivityItem[] = [];

  payments.forEach((p) => {
    const inv = invoiceById.get(p.invoiceId);
    const cname = inv ? (customerNameById.get(inv.customerId) ?? "—") : "—";
    items.push({
      date: p.paidAt,
      kind: "payment",
      text: `入金: ${cname} ${formatYen(p.amount)}`,
      href: inv ? `/invoices/${inv.id}` : "/invoices",
    });
  });

  deals
    .filter((d) => d.stage === "won" && d.closedAt)
    .forEach((d) => {
      const cname = customerNameById.get(d.customerId) ?? "—";
      items.push({
        date: d.closedAt!,
        kind: "deal",
        text: `受注: ${cname} ${formatYen(d.amount)}（${d.title}）`,
        href: `/deals/${d.id}`,
      });
    });

  invoices
    .filter((i) => i.status === "sent")
    .forEach((i) => {
      const cname = customerNameById.get(i.customerId) ?? "—";
      items.push({
        date: i.issueDate,
        kind: "invoice",
        text: `請求送付: ${cname} ${formatYen(i.total)}（${i.number}）`,
        href: `/invoices/${i.id}`,
      });
    });

  const top = items
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 10);

  return (
    <Card className="p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-ink-950)]">
          直近の動き
        </h3>
        <p className="text-xs text-[var(--color-ink-500)]">
          入金・受注・請求送付の最新10件
        </p>
      </div>
      {top.length === 0 ? (
        <p className="text-xs text-[var(--color-ink-500)]">活動なし</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {top.map((it, idx) => (
            <li key={idx} className="flex items-center justify-between gap-3">
              <Link
                href={it.href}
                className="min-w-0 flex-1 truncate text-[var(--color-ink-950)] hover:text-[var(--color-accent-700)]"
              >
                {it.text}
              </Link>
              <span className="font-mono text-xs text-[var(--color-ink-500)]">
                {fmtDate(it.date)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
