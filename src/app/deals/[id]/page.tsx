"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Pencil, Receipt, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DealStageBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  QuoteStatusBadge,
  InvoiceStatusBadge,
} from "@/components/shared/status-badge";
import { DealSheet } from "@/components/deals/deal-sheet";
import { useDealsStore } from "@/lib/store/deals";
import { useCustomersStore } from "@/lib/store/customers";
import { useQuotesStore } from "@/lib/store/quotes";
import { useInvoicesStore } from "@/lib/store/invoices";
import { useMounted } from "@/hooks/use-mounted";
import { formatYen } from "@/lib/utils/currency";
import { fmtDate, fmtDateTime } from "@/lib/utils/date";
import { toast } from "sonner";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function DealDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const mounted = useMounted();

  const deals = useDealsStore((s) => s.deals);
  const remove = useDealsStore((s) => s.remove);
  const customers = useCustomersStore((s) => s.customers);
  const allQuotes = useQuotesStore((s) => s.quotes);
  const allInvoices = useInvoicesStore((s) => s.invoices);

  const deal = useMemo(
    () => deals.find((d) => d.id === id),
    [deals, id],
  );
  const customer = useMemo(
    () =>
      deal ? customers.find((c) => c.id === deal.customerId) : undefined,
    [customers, deal],
  );
  const quotes = useMemo(
    () => allQuotes.filter((q) => q.dealId === id),
    [allQuotes, id],
  );
  const invoices = useMemo(
    () => allInvoices.filter((inv) => inv.dealId === id),
    [allInvoices, id],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const probability = useMemo(
    () => Math.max(0, Math.min(100, deal?.probability ?? 0)),
    [deal?.probability],
  );

  if (!mounted) {
    return (
      <AppShell>
        <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
      </AppShell>
    );
  }

  if (!deal) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Link
            href="/deals"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-950)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 案件一覧へ
          </Link>
          <EmptyState
            title="案件が見つかりません"
            description="削除されたか、存在しない ID です"
          />
        </div>
      </AppShell>
    );
  }

  const handleDelete = () => {
    remove(deal.id);
    toast.success("案件を削除しました");
    router.push("/deals");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link
            href="/deals"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-950)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 案件一覧へ
          </Link>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
                {deal.title}
              </h1>
              <DealStageBadge stage={deal.stage} />
            </div>
            <p className="text-sm text-[var(--color-ink-500)]">
              {customer ? (
                <Link
                  href={`/customers/${customer.id}`}
                  className="hover:underline"
                >
                  {customer.name}
                </Link>
              ) : (
                "顧客未設定"
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/quotes/new?dealId=${deal.id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <FileText className="h-4 w-4" />
              見積作成
            </Link>
            <Link
              href={`/invoices/new?dealId=${deal.id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Receipt className="h-4 w-4" />
              請求作成
            </Link>
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
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-xl border border-[var(--color-line)] bg-card p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--color-ink-950)]">
              基本情報
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="顧客">
                {customer ? customer.name : "—"}
              </Field>
              <Field label="ステージ">
                <DealStageBadge stage={deal.stage} />
              </Field>
              <Field label="金額">
                <span className="text-base font-semibold text-[var(--color-accent-700)]">
                  {formatYen(deal.amount)}
                </span>
              </Field>
              <Field label="確度">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-ink-950)]">
                    {probability}%
                  </span>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                    <div
                      className="h-1.5 rounded-full bg-[var(--color-accent-600)]"
                      style={{ width: `${probability}%` }}
                    />
                  </div>
                </div>
              </Field>
              <Field label="期待クローズ">
                {fmtDate(deal.expectedCloseDate)}
              </Field>
              <Field label="クローズ日">
                {deal.closedAt ? fmtDate(deal.closedAt) : "—"}
              </Field>
              <Field label="次アクション">
                {deal.nextAction || "—"}
              </Field>
              <Field label="失注理由">
                {deal.lostReason || "—"}
              </Field>
            </dl>

            <div className="mt-6">
              <p className="text-xs font-medium text-[var(--color-ink-500)]">
                メモ
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-ink-700)]">
                {deal.notes || "（メモなし）"}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-line)] bg-card p-5">
            <h2 className="text-sm font-semibold text-[var(--color-ink-950)]">
              ステージ履歴
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex items-center justify-between border-b border-[var(--color-line)] pb-2">
                <span className="text-[var(--color-ink-500)]">作成</span>
                <span className="text-[var(--color-ink-700)]">
                  {fmtDateTime(deal.createdAt)}
                </span>
              </li>
              <li className="flex items-center justify-between border-b border-[var(--color-line)] pb-2">
                <span className="text-[var(--color-ink-500)]">最終更新</span>
                <span className="text-[var(--color-ink-700)]">
                  {fmtDateTime(deal.updatedAt)}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-[var(--color-ink-500)]">
                  現在ステージ
                </span>
                <DealStageBadge stage={deal.stage} />
              </li>
            </ul>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[var(--color-line)] bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-ink-950)]">
                関連見積
              </h2>
              <Link
                href={`/quotes/new?dealId=${deal.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                )}
              >
                + 追加
              </Link>
            </div>
            {quotes.length === 0 ? (
              <p className="mt-3 text-xs text-[var(--color-ink-500)]">
                まだ見積はありません
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {quotes.map((q) => (
                  <li
                    key={q.id}
                    className="flex items-center justify-between rounded-md border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/quotes/${q.id}`}
                        className="block truncate text-sm font-medium text-[var(--color-ink-950)] hover:underline"
                      >
                        {q.number} ・ {q.title}
                      </Link>
                      <p className="text-[11px] text-[var(--color-ink-500)]">
                        {fmtDate(q.issueDate)} ・ {formatYen(q.total)}
                      </p>
                    </div>
                    <QuoteStatusBadge status={q.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-[var(--color-line)] bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-ink-950)]">
                関連請求
              </h2>
              <Link
                href={`/invoices/new?dealId=${deal.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                )}
              >
                + 追加
              </Link>
            </div>
            {invoices.length === 0 ? (
              <p className="mt-3 text-xs text-[var(--color-ink-500)]">
                まだ請求はありません
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between rounded-md border border-[var(--color-line)] bg-[var(--color-bg-soft)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="block truncate text-sm font-medium text-[var(--color-ink-950)] hover:underline"
                      >
                        {inv.number} ・ {inv.title}
                      </Link>
                      <p className="text-[11px] text-[var(--color-ink-500)]">
                        {fmtDate(inv.issueDate)} ・ {formatYen(inv.total)}
                      </p>
                    </div>
                    <InvoiceStatusBadge status={inv.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <DealSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={deal}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="この案件を削除しますか？"
        description="削除した案件は元に戻せません。関連する見積・請求は残ります。"
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-[var(--color-ink-500)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[var(--color-ink-950)]">{children}</dd>
    </div>
  );
}
