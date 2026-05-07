"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileDown,
  Mail,
  Pencil,
  Printer,
  Receipt,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { parseISO, isBefore } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import {
  DetailBackLink,
  DetailHeader,
  DetailSection,
  DetailField,
  DetailFieldGrid,
  DetailMetaList,
} from "@/components/shared/detail-layout";
import { InvoiceEditor } from "@/components/invoices/invoice-editor";
import { InvoicePrint } from "@/components/invoices/invoice-print";
import { PaymentModal } from "@/components/invoices/payment-modal";
import { DunningEmailModal } from "@/components/invoices/dunning-email-modal";
import { useInvoicesStore } from "@/lib/store/invoices";
import { useCustomersStore } from "@/lib/store/customers";
import { usePaymentsStore } from "@/lib/store/payments";
import { useSettingsStore } from "@/lib/store/settings";
import { fmtDate, fmtDateTime } from "@/lib/utils/date";
import { formatYen } from "@/lib/utils/currency";
import { buildPdfFilename, downloadBlob } from "@/lib/pdf/download";
import { PAYMENT_METHOD_LABELS } from "@/lib/types/payment";
import type { InvoiceStatus } from "@/lib/types/invoice";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const invoices = useInvoicesStore((s) => s.invoices);
  const removeInvoice = useInvoicesStore((s) => s.remove);
  const customers = useCustomersStore((s) => s.customers);
  const payments = usePaymentsStore((s) => s.payments);
  const company = useSettingsStore((s) => s.settings.company);

  const [editing, setEditing] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [dunningOpen, setDunningOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const today = useMemo(() => new Date(), []);
  const invoice = useMemo(
    () => invoices.find((inv) => inv.id === id),
    [invoices, id],
  );
  const customer = useMemo(
    () =>
      invoice
        ? customers.find((c) => c.id === invoice.customerId)
        : undefined,
    [customers, invoice],
  );

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
        <div className="space-y-4">
          <DetailBackLink href="/invoices" label="請求一覧へ" />
          <EmptyState
            icon={<Receipt className="h-7 w-7" />}
            title="請求が見つかりません"
            description="削除されたか、URL が変更されている可能性があります。"
            action={
              <Link
                href="/invoices"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                請求一覧へ戻る
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

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

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloadingPdf(true);
    try {
      const [{ pdf }, { InvoicePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/invoice-pdf"),
      ]);
      const blob = await pdf(
        <InvoicePdf
          invoice={invoice}
          customer={customer}
          company={company}
        />,
      ).toBlob();
      downloadBlob(
        blob,
        buildPdfFilename("請求書", invoice.number, customer?.name),
      );
      toast.success("PDF をダウンロードしました");
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("PDF の生成に失敗しました");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <>
      <div className="screen-only">
        <AppShell>
          <div className="space-y-6">
            <DetailBackLink href="/invoices" label="請求一覧へ" />

            <DetailHeader
              eyebrow={invoice.number}
              title={invoice.title || "（無題）"}
              subtitle={
                customer ? (
                  <Link
                    href={`/customers/${customer.id}`}
                    className="hover:underline"
                  >
                    {customer.name}
                  </Link>
                ) : (
                  "顧客未設定"
                )
              }
              badges={<InvoiceStatusBadge status={effectiveStatus} />}
              actions={
                !editing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                    >
                      <FileDown className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {downloadingPdf ? "生成中..." : "PDF"}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                    >
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">印刷</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPayOpen(true)}
                      disabled={invoice.status === "paid"}
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="hidden sm:inline">入金記録</span>
                    </Button>
                    {effectiveStatus === "overdue" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDunningOpen(true)}
                        className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          督促メール下書き
                        </span>
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="hidden sm:inline">編集</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">削除</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(false)}
                  >
                    編集を終了
                  </Button>
                )
              }
            />

            {editing ? (
              <InvoiceEditor invoice={invoice} />
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-3">
                  <DetailSection title="基本情報" className="lg:col-span-2">
                    <DetailFieldGrid>
                      <DetailField label="件名">{invoice.title}</DetailField>
                      <DetailField label="顧客">
                        {customer?.name ?? "—"}
                      </DetailField>
                      <DetailField label="発行日">
                        {fmtDate(invoice.issueDate)}
                      </DetailField>
                      <DetailField label="支払期日">
                        <span
                          className={cn(
                            effectiveStatus === "overdue"
                              ? "font-semibold text-red-600"
                              : "",
                          )}
                        >
                          {fmtDate(invoice.dueDate)}
                        </span>
                      </DetailField>
                      {invoice.quoteId ? (
                        <DetailField label="関連見積">
                          <span className="font-mono text-xs">
                            {invoice.quoteId}
                          </span>
                        </DetailField>
                      ) : null}
                      {invoice.paidAt ? (
                        <DetailField label="入金日">
                          {fmtDate(invoice.paidAt)}
                        </DetailField>
                      ) : null}
                    </DetailFieldGrid>
                    {invoice.notes ? (
                      <div className="mt-6 border-t border-[var(--color-line)] pt-4">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-500)]">
                          備考
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-700)]">
                          {invoice.notes}
                        </p>
                      </div>
                    ) : null}
                  </DetailSection>

                  <div className="space-y-4">
                    <DetailSection title="サマリー">
                      <DetailMetaList
                        items={[
                          {
                            label: "小計",
                            value: (
                              <span className="font-mono tabular-nums">
                                {formatYen(invoice.subtotal)}
                              </span>
                            ),
                          },
                          {
                            label: "消費税",
                            value: (
                              <span className="font-mono tabular-nums">
                                {formatYen(invoice.tax)}
                              </span>
                            ),
                          },
                          {
                            label: "合計",
                            value: (
                              <span className="font-mono text-base font-bold tabular-nums text-[var(--color-accent-700)]">
                                {formatYen(invoice.total)}
                              </span>
                            ),
                          },
                        ]}
                      />
                    </DetailSection>

                    <DetailSection title="メタ情報">
                      <DetailMetaList
                        items={[
                          {
                            label: "作成日時",
                            value: fmtDateTime(invoice.createdAt),
                          },
                          {
                            label: "最終更新",
                            value: fmtDateTime(invoice.updatedAt),
                          },
                        ]}
                      />
                    </DetailSection>
                  </div>
                </div>

                <DetailSection title="明細" bodyClassName="space-y-4">
                  <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-line)] text-left text-[11px] uppercase tracking-wider text-[var(--color-ink-500)]">
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
                            <td className="p-2 text-[var(--color-ink-950)]">
                              {item.description}
                            </td>
                            <td className="p-2 text-right tabular-nums">
                              {item.quantity}
                            </td>
                            <td className="p-2 text-[var(--color-ink-700)]">
                              {item.unit}
                            </td>
                            <td className="p-2 text-right tabular-nums">
                              {formatYen(item.unitPrice)}
                            </td>
                            <td className="p-2 text-right font-medium tabular-nums text-[var(--color-ink-950)]">
                              {formatYen(item.quantity * item.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DetailSection>

                <DetailSection
                  title="入金履歴"
                  description={`${invoicePayments.length} 件`}
                  actions={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPayOpen(true)}
                      disabled={invoice.status === "paid"}
                    >
                      <Wallet className="h-4 w-4" />
                      入金記録
                    </Button>
                  }
                >
                  {invoicePayments.length === 0 ? (
                    <p className="text-sm text-[var(--color-ink-500)]">
                      まだ入金は記録されていません。
                    </p>
                  ) : (
                    <ul className="divide-y divide-[var(--color-line)]">
                      {invoicePayments.map((p) => (
                        <li
                          key={p.id}
                          className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-medium text-[var(--color-ink-950)]">
                              {fmtDate(p.paidAt)}
                            </span>
                            <span className="rounded-full bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[11px] text-[var(--color-ink-700)]">
                              {PAYMENT_METHOD_LABELS[p.method]}
                            </span>
                            {p.notes ? (
                              <span className="text-xs text-[var(--color-ink-500)]">
                                {p.notes}
                              </span>
                            ) : null}
                          </div>
                          <span className="font-mono text-base font-semibold tabular-nums text-[var(--color-cyan-700)]">
                            {formatYen(p.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </DetailSection>
              </>
            )}
          </div>

          <PaymentModal
            open={payOpen}
            onOpenChange={setPayOpen}
            invoice={invoice}
          />
          <DunningEmailModal
            open={dunningOpen}
            onOpenChange={setDunningOpen}
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
