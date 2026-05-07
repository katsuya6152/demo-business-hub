"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Printer,
  Receipt,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { parseISO, isBefore } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { InvoiceEditor } from "@/components/invoices/invoice-editor";
import { InvoicePrint } from "@/components/invoices/invoice-print";
import { PaymentModal } from "@/components/invoices/payment-modal";
import { useInvoicesStore } from "@/lib/store/invoices";
import { useCustomersStore } from "@/lib/store/customers";
import { usePaymentsStore } from "@/lib/store/payments";
import { fmtDate } from "@/lib/utils/date";
import { formatYen } from "@/lib/utils/currency";
import { PAYMENT_METHOD_LABELS } from "@/lib/types/payment";
import type { InvoiceStatus } from "@/lib/types/invoice";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const invoice = useInvoicesStore((s) =>
    s.invoices.find((inv) => inv.id === id),
  );
  const removeInvoice = useInvoicesStore((s) => s.remove);

  const customers = useCustomersStore((s) => s.customers);
  const payments = usePaymentsStore((s) => s.payments);

  const [editing, setEditing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const today = useMemo(() => new Date(), []);

  const invoicePayments = useMemo(
    () =>
      invoice
        ? payments
            .filter((p) => p.invoiceId === invoice.id)
            .sort(
              (a, b) =>
                new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
            )
        : [],
    [invoice, payments],
  );

  if (!invoice) {
    return (
      <AppShell>
        <EmptyState
          icon={<Receipt className="h-8 w-8" />}
          title="請求が見つかりません"
          description="削除されたか、URL が変更されている可能性があります。"
          action={
            <Button onClick={() => router.push("/invoices")}>
              <ArrowLeft className="h-4 w-4" />
              請求一覧へ戻る
            </Button>
          }
        />
      </AppShell>
    );
  }

  const customer = customers.find((c) => c.id === invoice.customerId);
  const effectiveStatus: InvoiceStatus =
    invoice.status === "sent" && isBefore(parseISO(invoice.dueDate), today)
      ? "overdue"
      : invoice.status;

  const handleDelete = () => {
    removeInvoice(invoice.id);
    toast.success("削除しました");
    router.push("/invoices");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      <div className="screen-only">
        <AppShell>
          <div className="space-y-6">
            <Link
              href="/invoices"
              className="inline-flex w-fit items-center gap-1 text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-950)]"
            >
              <ArrowLeft className="h-3 w-3" />
              請求一覧
            </Link>

            <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
                  {invoice.number}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-500)]">
                  <InvoiceStatusBadge status={effectiveStatus} />
                  <span>{customer?.name ?? "—"}</span>
                  <span>発行 {fmtDate(invoice.issueDate)}</span>
                  <span>期限 {fmtDate(invoice.dueDate)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!editing ? (
                  <>
                    <Button variant="outline" onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                      印刷
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPayOpen(true)}
                      disabled={invoice.status === "paid"}
                    >
                      <Wallet className="h-4 w-4" />
                      入金記録
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      編集
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      削除
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    編集を終了
                  </Button>
                )}
              </div>
            </header>

            {editing ? (
              <InvoiceEditor invoice={invoice} />
            ) : (
              <>
                <section className="rounded-lg border border-[var(--color-line)] bg-card p-5">
                  <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-950)]">
                    基本情報
                  </h2>
                  <dl className="grid gap-x-6 gap-y-3 text-sm md:grid-cols-2">
                    <div>
                      <dt className="text-xs text-[var(--color-ink-500)]">
                        件名
                      </dt>
                      <dd className="mt-0.5 text-[var(--color-ink-950)]">
                        {invoice.title}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--color-ink-500)]">
                        顧客
                      </dt>
                      <dd className="mt-0.5 text-[var(--color-ink-950)]">
                        {customer?.name ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--color-ink-500)]">
                        発行日
                      </dt>
                      <dd className="mt-0.5 text-[var(--color-ink-950)]">
                        {fmtDate(invoice.issueDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--color-ink-500)]">
                        支払期日
                      </dt>
                      <dd className="mt-0.5 text-[var(--color-ink-950)]">
                        {fmtDate(invoice.dueDate)}
                      </dd>
                    </div>
                    {invoice.quoteId ? (
                      <div>
                        <dt className="text-xs text-[var(--color-ink-500)]">
                          関連見積
                        </dt>
                        <dd className="mt-0.5 text-[var(--color-ink-950)]">
                          {invoice.quoteId}
                        </dd>
                      </div>
                    ) : null}
                    {invoice.paidAt ? (
                      <div>
                        <dt className="text-xs text-[var(--color-ink-500)]">
                          入金日
                        </dt>
                        <dd className="mt-0.5 text-[var(--color-ink-950)]">
                          {fmtDate(invoice.paidAt)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </section>

                <section className="rounded-lg border border-[var(--color-line)] bg-card p-5">
                  <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-950)]">
                    明細
                  </h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-line)] text-left text-xs text-[var(--color-ink-500)]">
                        <th className="p-2 font-medium">品目</th>
                        <th className="p-2 text-right font-medium">数量</th>
                        <th className="p-2 font-medium">単位</th>
                        <th className="p-2 text-right font-medium">単価</th>
                        <th className="p-2 text-right font-medium">金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-[var(--color-line)] last:border-b-0"
                        >
                          <td className="p-2">{item.description}</td>
                          <td className="p-2 text-right tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="p-2">{item.unit}</td>
                          <td className="p-2 text-right tabular-nums">
                            {formatYen(item.unitPrice)}
                          </td>
                          <td className="p-2 text-right tabular-nums">
                            {formatYen(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 flex justify-end">
                    <dl className="w-full max-w-xs space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-[var(--color-ink-500)]">小計</dt>
                        <dd className="tabular-nums text-[var(--color-ink-950)]">
                          {formatYen(invoice.subtotal)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-[var(--color-ink-500)]">消費税</dt>
                        <dd className="tabular-nums text-[var(--color-ink-950)]">
                          {formatYen(invoice.tax)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-2 text-base font-bold">
                        <dt>合計</dt>
                        <dd className="tabular-nums text-[var(--color-ink-950)]">
                          {formatYen(invoice.total)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </section>

                {invoice.notes ? (
                  <section className="rounded-lg border border-[var(--color-line)] bg-card p-5">
                    <h2 className="mb-2 text-sm font-semibold text-[var(--color-ink-950)]">
                      備考
                    </h2>
                    <p className="whitespace-pre-wrap text-sm text-[var(--color-ink-700)]">
                      {invoice.notes}
                    </p>
                  </section>
                ) : null}

                <section className="rounded-lg border border-[var(--color-line)] bg-card p-5">
                  <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink-950)]">
                    入金履歴（{invoicePayments.length} 件）
                  </h2>
                  {invoicePayments.length === 0 ? (
                    <p className="text-sm text-[var(--color-ink-500)]">
                      まだ入金は記録されていません。
                    </p>
                  ) : (
                    <ul className="divide-y divide-[var(--color-line)]">
                      {invoicePayments.map((p) => (
                        <li
                          key={p.id}
                          className="flex flex-col gap-1 py-2 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-medium text-[var(--color-ink-950)]">
                              {fmtDate(p.paidAt)}
                            </span>
                            <span className="text-xs text-[var(--color-ink-500)]">
                              {PAYMENT_METHOD_LABELS[p.method]}
                            </span>
                            {p.notes ? (
                              <span className="text-xs text-[var(--color-ink-500)]">
                                {p.notes}
                              </span>
                            ) : null}
                          </div>
                          <span className="font-semibold tabular-nums text-[var(--color-ink-950)]">
                            {formatYen(p.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>

          <PaymentModal
            open={payOpen}
            onOpenChange={setPayOpen}
            invoice={invoice}
          />
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="請求を削除しますか？"
            description={
              <>
                <strong>{invoice.number}</strong> を削除します。
                この操作は元に戻せません。
              </>
            }
            confirmLabel="削除する"
            variant="destructive"
            onConfirm={handleDelete}
          />
        </AppShell>
      </div>

      <InvoicePrint invoice={invoice} />
    </>
  );
}
