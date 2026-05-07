"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Receipt } from "lucide-react";
import { parseISO, isBefore } from "date-fns";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { InvoiceSummaryCards } from "@/components/invoices/invoice-summary-cards";
import { PaymentModal } from "@/components/invoices/payment-modal";
import { useInvoicesStore } from "@/lib/store/invoices";
import { useCustomersStore } from "@/lib/store/customers";
import {
  INVOICE_STATUS_LABELS,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/types/invoice";

type StatusFilter = "all" | InvoiceStatus;

export default function InvoicesPage() {
  const router = useRouter();
  const invoices = useInvoicesStore((s) => s.invoices);
  const removeInvoice = useInvoicesStore((s) => s.remove);
  const customers = useCustomersStore((s) => s.customers);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const today = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      const effective: InvoiceStatus =
        inv.status === "sent" && isBefore(parseISO(inv.dueDate), today)
          ? "overdue"
          : inv.status;
      if (statusFilter !== "all" && effective !== statusFilter) return false;
      if (!q) return true;
      const customer = customers.find((c) => c.id === inv.customerId);
      return (
        inv.number.toLowerCase().includes(q) ||
        inv.title.toLowerCase().includes(q) ||
        (customer?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [invoices, customers, query, statusFilter, today]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    removeInvoice(deleteTarget.id);
    toast.success("削除しました");
    setDeleteTarget(null);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
              請求一覧
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">
              {invoices.length} 件 ・ 検索 / フィルタで絞り込み
            </p>
          </div>
          <Button onClick={() => router.push("/invoices/new")}>
            <Plus className="h-4 w-4" />
            新規請求
          </Button>
        </header>

        <InvoiceSummaryCards invoices={invoices} />

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="番号 / 件名 / 顧客で検索"
              aria-label="請求検索"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              if (v) setStatusFilter(v as StatusFilter);
            }}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全てのステータス</SelectItem>
              <SelectItem value="draft">
                {INVOICE_STATUS_LABELS.draft}
              </SelectItem>
              <SelectItem value="sent">
                {INVOICE_STATUS_LABELS.sent}
              </SelectItem>
              <SelectItem value="paid">
                {INVOICE_STATUS_LABELS.paid}
              </SelectItem>
              <SelectItem value="overdue">
                {INVOICE_STATUS_LABELS.overdue}
              </SelectItem>
              <SelectItem value="cancelled">
                {INVOICE_STATUS_LABELS.cancelled}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-8 w-8" />}
            title={
              invoices.length === 0
                ? "請求がまだ登録されていません"
                : "条件に一致する請求がありません"
            }
            description={
              invoices.length === 0
                ? "「+ 新規請求」から最初の請求を発行しましょう。"
                : "検索条件やフィルタを変えてみてください。"
            }
            action={
              invoices.length === 0 ? (
                <Button onClick={() => router.push("/invoices/new")}>
                  <Plus className="h-4 w-4" />
                  新規請求
                </Button>
              ) : null
            }
          />
        ) : (
          <InvoiceTable
            invoices={filtered}
            customers={customers}
            onPay={(inv) => setPayTarget(inv)}
            onDelete={(inv) => setDeleteTarget(inv)}
          />
        )}
      </div>

      <PaymentModal
        open={payTarget !== null}
        onOpenChange={(open) => !open && setPayTarget(null)}
        invoice={payTarget}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="請求を削除しますか？"
        description={
          deleteTarget ? (
            <>
              <strong>{deleteTarget.number}</strong> を削除します。
              この操作は元に戻せません。
            </>
          ) : null
        }
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
