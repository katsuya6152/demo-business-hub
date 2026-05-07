"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Wallet, Briefcase, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import { formatYen } from "@/lib/utils/currency";
import { fmtDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

type ActivityKind = "payment" | "deal" | "invoice";

type ActivityItem = {
  date: string;
  kind: ActivityKind;
  customer: string;
  amount: number;
  label: string;
  href: string;
};

const KIND_STYLE: Record<
  ActivityKind,
  {
    icon: typeof Wallet;
    bg: string;
    text: string;
    label: string;
  }
> = {
  payment: {
    icon: Wallet,
    bg: "bg-[var(--color-cyan-50)]",
    text: "text-[var(--color-cyan-700)]",
    label: "入金",
  },
  deal: {
    icon: Briefcase,
    bg: "bg-[var(--color-accent-50)]",
    text: "text-[var(--color-accent-700)]",
    label: "受注",
  },
  invoice: {
    icon: FileText,
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: "請求送付",
  },
};

export function RecentActivity() {
  const customers = useCustomersStore((s) => s.customers);
  const deals = useDealsStore((s) => s.deals);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);

  const customerNameById = useMemo(
    () => new Map(customers.map((c) => [c.id, c.name])),
    [customers],
  );
  const invoiceById = useMemo(
    () => new Map(invoices.map((i) => [i.id, i])),
    [invoices],
  );

  const items = useMemo<ActivityItem[]>(() => {
    const acc: ActivityItem[] = [];
    payments.forEach((p) => {
      const inv = invoiceById.get(p.invoiceId);
      const cname = inv ? (customerNameById.get(inv.customerId) ?? "—") : "—";
      acc.push({
        date: p.paidAt,
        kind: "payment",
        customer: cname,
        amount: p.amount,
        label: "",
        href: inv ? `/invoices/${inv.id}` : "/invoices",
      });
    });
    deals
      .filter((d) => d.stage === "won" && d.closedAt)
      .forEach((d) => {
        acc.push({
          date: d.closedAt!,
          kind: "deal",
          customer: customerNameById.get(d.customerId) ?? "—",
          amount: d.amount,
          label: d.title,
          href: `/deals/${d.id}`,
        });
      });
    invoices
      .filter((i) => i.status === "sent")
      .forEach((i) => {
        acc.push({
          date: i.issueDate,
          kind: "invoice",
          customer: customerNameById.get(i.customerId) ?? "—",
          amount: i.total,
          label: i.number,
          href: `/invoices/${i.id}`,
        });
      });
    return acc.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10);
  }, [payments, deals, invoices, customerNameById, invoiceById]);

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[var(--color-ink-950)]">
          直近の動き
        </h3>
        <p className="text-xs text-[var(--color-ink-500)]">
          入金・受注・請求送付の最新 10 件
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-500)]">活動はまだありません</p>
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {items.map((it, idx) => {
            const style = KIND_STYLE[it.kind];
            const Icon = style.icon;
            return (
              <li key={idx}>
                <Link
                  href={it.href}
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--color-bg-soft)]"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      style.bg,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", style.text)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={cn("font-semibold", style.text)}>
                        {style.label}
                      </span>
                      <span className="font-mono text-[var(--color-ink-500)]">
                        {fmtDate(it.date)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-[var(--color-ink-950)] group-hover:text-[var(--color-accent-700)]">
                      {it.customer}
                      {it.label ? (
                        <span className="ml-1 text-[var(--color-ink-500)]">
                          ／ {it.label}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm font-semibold text-[var(--color-ink-950)] tabular-nums">
                    {formatYen(it.amount)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
