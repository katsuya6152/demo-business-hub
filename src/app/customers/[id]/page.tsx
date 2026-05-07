"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  CustomerStatusBadge,
  DealStageBadge,
  InvoiceStatusBadge,
  QuoteStatusBadge,
} from "@/components/shared/status-badge";
import { CustomerSheet } from "@/components/customers/customer-sheet";
import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import { useQuotesStore } from "@/lib/store/quotes";
import { customerRevenue } from "@/lib/utils/aggregations";
import { formatYen } from "@/lib/utils/currency";
import { fmtDate, fmtRelative } from "@/lib/utils/date";
import { toast } from "sonner";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const customer = useCustomersStore((s) =>
    s.customers.find((c) => c.id === id),
  );
  const removeCustomer = useCustomersStore((s) => s.remove);

  const deals = useDealsStore((s) => s.deals);
  const quotes = useQuotesStore((s) => s.quotes);
  const invoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const customerDeals = useMemo(
    () => (customer ? deals.filter((d) => d.customerId === customer.id) : []),
    [customer, deals],
  );
  const customerQuotes = useMemo(
    () => (customer ? quotes.filter((q) => q.customerId === customer.id) : []),
    [customer, quotes],
  );
  const customerInvoices = useMemo(
    () =>
      customer ? invoices.filter((i) => i.customerId === customer.id) : [],
    [customer, invoices],
  );

  const summary = useMemo(() => {
    if (!customer) {
      return { quotedTotal: 0, invoicedTotal: 0, paidTotal: 0, unpaid: 0 };
    }
    const quotedTotal = customerQuotes.reduce((s, q) => s + q.total, 0);
    const invoicedTotal = customerInvoices
      .filter((i) => i.status !== "draft" && i.status !== "cancelled")
      .reduce((s, i) => s + i.total, 0);
    const paidTotal = customerRevenue(customer.id, payments, invoices);
    const unpaid = Math.max(0, invoicedTotal - paidTotal);
    return { quotedTotal, invoicedTotal, paidTotal, unpaid };
  }, [customer, customerQuotes, customerInvoices, payments, invoices]);

  if (!customer) {
    return (
      <AppShell>
        <EmptyState
          icon={<UserRound className="h-8 w-8" />}
          title="顧客が見つかりません"
          description="削除されたか、URL が変更されている可能性があります。"
          action={
            <Button onClick={() => router.push("/customers")}>
              <ArrowLeft className="h-4 w-4" />
              顧客一覧へ戻る
            </Button>
          }
        />
      </AppShell>
    );
  }

  const handleDelete = () => {
    removeCustomer(customer.id);
    toast.success("削除しました");
    router.push("/customers");
  };

  const recentDeals = customerDeals.slice(0, 3);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <Link
            href="/customers"
            className="inline-flex w-fit items-center gap-1 text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-950)]"
          >
            <ArrowLeft className="h-3 w-3" />
            顧客一覧
          </Link>
          <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
                {customer.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-500)]">
                <CustomerStatusBadge status={customer.status} />
                {customer.industry ? <span>{customer.industry}</span> : null}
                <span>登録 {fmtDate(customer.createdAt)}</span>
                <span>更新 {fmtRelative(customer.updatedAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                編集
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
            </div>
          </header>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Section title="基本情報" className="lg:col-span-2">
            <dl className="grid gap-x-6 gap-y-3 text-sm md:grid-cols-2">
              <Field label="業種" value={customer.industry || "—"} />
              <Field
                label="ステータス"
                value={<CustomerStatusBadge status={customer.status} />}
              />
              <Field label="担当者" value={customer.contactPerson} />
              <Field label="役職" value={customer.contactRole || "—"} />
              <Field
                label="Email"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[var(--color-ink-500)]" />
                    {customer.email}
                  </span>
                }
              />
              <Field
                label="電話"
                value={
                  customer.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-[var(--color-ink-500)]" />
                      {customer.phone}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="郵便番号"
                value={customer.postalCode || "—"}
              />
              <Field
                label="住所"
                value={
                  customer.address ? (
                    <span className="inline-flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 text-[var(--color-ink-500)]" />
                      {customer.address}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </Section>

          <Section title="サマリー">
            <dl className="space-y-3 text-sm">
              <SummaryRow
                label="累積見積額"
                value={formatYen(summary.quotedTotal)}
              />
              <SummaryRow
                label="累積請求額"
                value={formatYen(summary.invoicedTotal)}
              />
              <SummaryRow
                label="累積入金額"
                value={formatYen(summary.paidTotal)}
              />
              <SummaryRow
                label="未入金額"
                value={formatYen(summary.unpaid)}
                emphasis={summary.unpaid > 0}
              />
            </dl>
          </Section>
        </div>

        <Section title="メモ">
          {customer.notes ? (
            <p className="whitespace-pre-wrap text-sm text-[var(--color-ink-700)]">
              {customer.notes}
            </p>
          ) : (
            <p className="text-sm text-[var(--color-ink-500)]">
              メモはまだ登録されていません。
            </p>
          )}
        </Section>

        <Section
          title="関連案件"
          subtitle={`${customerDeals.length} 件 ・ 合計 ${formatYen(
            customerDeals.reduce((s, d) => s + d.amount, 0),
          )}`}
        >
          {recentDeals.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-500)]">
              関連する案件はありません。
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-line)]">
              {recentDeals.map((deal) => (
                <li
                  key={deal.id}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-2">
                    <DealStageBadge stage={deal.stage} />
                    <span className="text-sm font-medium text-[var(--color-ink-950)]">
                      {deal.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-ink-500)]">
                    <span>確度 {deal.probability}%</span>
                    <span>クローズ予定 {fmtDate(deal.expectedCloseDate)}</span>
                    <span className="font-medium text-[var(--color-ink-950)] tabular-nums">
                      {formatYen(deal.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="取引履歴"
          subtitle={`見積 ${customerQuotes.length} 件 / 請求 ${customerInvoices.length} 件`}
        >
          {customerQuotes.length === 0 && customerInvoices.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-500)]">
              まだ取引はありません。
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--color-ink-500)]">
                  見積（{customerQuotes.length} 件）
                </p>
                {customerQuotes.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-500)]">
                    見積はありません。
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--color-line)]">
                    {customerQuotes.map((q) => (
                      <li
                        key={q.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <QuoteStatusBadge status={q.status} />
                          <span className="font-medium text-[var(--color-ink-950)]">
                            {q.number}
                          </span>
                        </div>
                        <span className="tabular-nums text-[var(--color-ink-700)]">
                          {formatYen(q.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--color-ink-500)]">
                  請求（{customerInvoices.length} 件）
                </p>
                {customerInvoices.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-500)]">
                    請求はありません。
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--color-line)]">
                    {customerInvoices.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <InvoiceStatusBadge status={inv.status} />
                          <span className="font-medium text-[var(--color-ink-950)]">
                            {inv.number}
                          </span>
                        </div>
                        <span className="tabular-nums text-[var(--color-ink-700)]">
                          {formatYen(inv.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Section>
      </div>

      <CustomerSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        customerId={customer.id}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="顧客を削除しますか？"
        description={
          <>
            <strong>{customer.name}</strong> を削除します。
            関連する案件・見積・請求は残りますが、顧客の参照は失われます。
            この操作は元に戻せません。
          </>
        }
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        "rounded-lg border border-[var(--color-line)] bg-card p-5" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--color-ink-950)]">
          {title}
        </h2>
        {subtitle ? (
          <span className="text-xs text-[var(--color-ink-500)]">
            {subtitle}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-[var(--color-ink-500)]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[var(--color-ink-950)]">{value}</dd>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--color-ink-500)]">{label}</dt>
      <dd
        className={
          "tabular-nums " +
          (emphasis
            ? "font-semibold text-red-600"
            : "font-medium text-[var(--color-ink-950)]")
        }
      >
        {value}
      </dd>
    </div>
  );
}
