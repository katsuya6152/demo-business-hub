"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Receipt, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DealStageBadge,
  QuoteStatusBadge,
  InvoiceStatusBadge,
} from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  DetailBackLink,
  DetailHeader,
  DetailSection,
  DetailField,
  DetailFieldGrid,
  DetailMetaList,
  RelatedRow,
  RelatedList,
} from "@/components/shared/detail-layout";
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

  const deal = useMemo(() => deals.find((d) => d.id === id), [deals, id]);
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
        <div className="space-y-4">
          <DetailBackLink href="/deals" label="案件一覧へ" />
          <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
        </div>
      </AppShell>
    );
  }

  if (!deal) {
    return (
      <AppShell>
        <div className="space-y-4">
          <DetailBackLink href="/deals" label="案件一覧へ" />
          <EmptyState
            title="案件が見つかりません"
            description="削除されたか、URL が誤っている可能性があります。"
            action={
              <Link
                href="/deals"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                一覧に戻る
              </Link>
            }
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
        <DetailBackLink href="/deals" label="案件一覧へ" />

        <DetailHeader
          eyebrow="案件"
          title={deal.title}
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
          badges={<DealStageBadge stage={deal.stage} />}
          actions={
            <>
              <Link
                href={`/quotes/new?dealId=${deal.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">見積作成</span>
              </Link>
              <Link
                href={`/invoices/new?dealId=${deal.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">請求作成</span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">編集</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">削除</span>
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <DetailSection title="基本情報" className="lg:col-span-2">
            <DetailFieldGrid>
              <DetailField label="顧客">
                {customer ? customer.name : "—"}
              </DetailField>
              <DetailField label="ステージ">
                <DealStageBadge stage={deal.stage} />
              </DetailField>
              <DetailField label="金額">
                <span className="text-base font-semibold text-[var(--color-accent-700)]">
                  {formatYen(deal.amount)}
                </span>
              </DetailField>
              <DetailField label="確度">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums text-[var(--color-ink-950)]">
                    {probability}%
                  </span>
                  <div className="h-1.5 flex-1 max-w-32 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
                    <div
                      className="h-1.5 rounded-full bg-[var(--color-accent-600)]"
                      style={{ width: `${probability}%` }}
                    />
                  </div>
                </div>
              </DetailField>
              <DetailField label="期待クローズ">
                {fmtDate(deal.expectedCloseDate)}
              </DetailField>
              <DetailField label="クローズ日">
                {deal.closedAt ? fmtDate(deal.closedAt) : "—"}
              </DetailField>
              <DetailField label="次アクション" className="sm:col-span-2">
                {deal.nextAction || "—"}
              </DetailField>
              {deal.lostReason ? (
                <DetailField label="失注理由" className="sm:col-span-2">
                  {deal.lostReason}
                </DetailField>
              ) : null}
            </DetailFieldGrid>

            <div className="mt-6 border-t border-[var(--color-line)] pt-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-500)]">
                メモ
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-700)]">
                {deal.notes || "（メモなし）"}
              </p>
            </div>
          </DetailSection>

          <DetailSection title="メタ情報">
            <DetailMetaList
              items={[
                {
                  label: "作成日時",
                  value: fmtDateTime(deal.createdAt),
                },
                {
                  label: "最終更新",
                  value: fmtDateTime(deal.updatedAt),
                },
                {
                  label: "現在のステージ",
                  value: <DealStageBadge stage={deal.stage} />,
                },
              ]}
            />
          </DetailSection>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailSection
            title="関連見積"
            description={`${quotes.length} 件`}
            actions={
              <Link
                href={`/quotes/new?dealId=${deal.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                )}
              >
                + 追加
              </Link>
            }
          >
            <RelatedList empty="関連する見積はありません">
              {quotes.map((q) => (
                <RelatedRow
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  primary={q.title || "（無題）"}
                  secondary={`${q.number} ・ ${fmtDate(q.issueDate)}`}
                  trailing={formatYen(q.total)}
                  badge={<QuoteStatusBadge status={q.status} />}
                />
              ))}
            </RelatedList>
          </DetailSection>

          <DetailSection
            title="関連請求"
            description={`${invoices.length} 件`}
            actions={
              <Link
                href={`/invoices/new?dealId=${deal.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                )}
              >
                + 追加
              </Link>
            }
          >
            <RelatedList empty="関連する請求はありません">
              {invoices.map((inv) => (
                <RelatedRow
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  primary={inv.title || "（無題）"}
                  secondary={`${inv.number} ・ ${fmtDate(inv.issueDate)}`}
                  trailing={formatYen(inv.total)}
                  badge={<InvoiceStatusBadge status={inv.status} />}
                />
              ))}
            </RelatedList>
          </DetailSection>
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
