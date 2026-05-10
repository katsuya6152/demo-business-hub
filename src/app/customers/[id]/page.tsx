"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  Trash2,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  CustomerStatusBadge,
  DealStageBadge,
  InvoiceStatusBadge,
  QuoteStatusBadge,
} from "@/components/shared/status-badge";
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
import { CustomerSheet } from "@/components/customers/customer-sheet";
import { useCustomersStore } from "@/lib/store/customers";
import { useDealsStore } from "@/lib/store/deals";
import { useInvoicesStore } from "@/lib/store/invoices";
import { usePaymentsStore } from "@/lib/store/payments";
import { useQuotesStore } from "@/lib/store/quotes";
import { customerRevenue } from "@/lib/utils/aggregations";
import { formatYen } from "@/lib/utils/currency";
import { fmtDate, fmtDateTime } from "@/lib/utils/date";
import { toast } from "sonner";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const customers = useCustomersStore((s) => s.customers);
  const removeCustomer = useCustomersStore((s) => s.remove);
  const allDeals = useDealsStore((s) => s.deals);
  const allQuotes = useQuotesStore((s) => s.quotes);
  const allInvoices = useInvoicesStore((s) => s.invoices);
  const payments = usePaymentsStore((s) => s.payments);

  const customer = useMemo(
    () => customers.find((c) => c.id === id),
    [customers, id],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const customerDeals = useMemo(
    () => (customer ? allDeals.filter((d) => d.customerId === customer.id) : []),
    [customer, allDeals],
  );
  const customerQuotes = useMemo(
    () =>
      customer ? allQuotes.filter((q) => q.customerId === customer.id) : [],
    [customer, allQuotes],
  );
  const customerInvoices = useMemo(
    () =>
      customer
        ? allInvoices.filter((i) => i.customerId === customer.id)
        : [],
    [customer, allInvoices],
  );

  const summary = useMemo(() => {
    if (!customer) {
      return { quotedTotal: 0, invoicedTotal: 0, paidTotal: 0, unpaid: 0 };
    }
    const quotedTotal = customerQuotes.reduce((s, q) => s + q.total, 0);
    const invoicedTotal = customerInvoices
      .filter((i) => i.status !== "draft" && i.status !== "cancelled")
      .reduce((s, i) => s + i.total, 0);
    const paidTotal = customerRevenue(customer.id, payments, allInvoices);
    const unpaid = Math.max(0, invoicedTotal - paidTotal);
    return { quotedTotal, invoicedTotal, paidTotal, unpaid };
  }, [customer, customerQuotes, customerInvoices, payments, allInvoices]);

  if (!customer) {
    return (
      <AppShell>
        <div className="space-y-4">
          <DetailBackLink href="/customers" label="顧客一覧へ" />
          <EmptyState
            icon={<UserRound className="h-7 w-7" />}
            title="顧客が見つかりません"
            description="削除されたか、URL が変更されている可能性があります。"
            action={
              <Link
                href="/customers"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                顧客一覧へ戻る
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const handleDelete = () => {
    removeCustomer(customer.id);
    toast.success("削除しました");
    router.push("/customers");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <DetailBackLink href="/customers" label="顧客一覧へ" />

        <DetailHeader
          eyebrow={customer.industry || "顧客"}
          title={customer.name}
          subtitle={
            <span className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-500)]">
              <UserRound className="h-3.5 w-3.5" />
              {customer.contactPerson}
              {customer.contactRole ? ` ・ ${customer.contactRole}` : ""}
            </span>
          }
          badges={<CustomerStatusBadge status={customer.status} />}
          actions={
            <>
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
              <DetailField label="業種">
                {customer.industry || "—"}
              </DetailField>
              <DetailField label="ステータス">
                <CustomerStatusBadge status={customer.status} />
              </DetailField>
              <DetailField label="担当者">
                {customer.contactPerson}
              </DetailField>
              <DetailField label="役職">
                {customer.contactRole || "—"}
              </DetailField>
              <DetailField label="メール">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-500)]" />
                  <a
                    href={`mailto:${customer.email}`}
                    className="break-all text-[var(--color-accent-700)] hover:underline"
                  >
                    {customer.email}
                  </a>
                </span>
              </DetailField>
              <DetailField label="電話">
                {customer.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[var(--color-ink-500)]" />
                    <a
                      href={`tel:${customer.phone}`}
                      className="hover:underline"
                    >
                      {customer.phone}
                    </a>
                  </span>
                ) : (
                  "—"
                )}
              </DetailField>
              <DetailField label="郵便番号">
                {customer.postalCode || "—"}
              </DetailField>
              <DetailField label="住所">
                {customer.address ? (
                  <span className="inline-flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-ink-500)]" />
                    <span className="break-words">{customer.address}</span>
                  </span>
                ) : (
                  "—"
                )}
              </DetailField>
            </DetailFieldGrid>

            <div className="mt-6 border-t border-[var(--color-line)] pt-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-500)]">
                メモ
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-700)]">
                {customer.notes || "（メモなし）"}
              </p>
            </div>
          </DetailSection>

          <div className="space-y-4">
            <DetailSection title="サマリー">
              <DetailMetaList
                items={[
                  {
                    label: "累積見積額",
                    value: (
                      <span className="font-mono tabular-nums">
                        {formatYen(summary.quotedTotal)}
                      </span>
                    ),
                  },
                  {
                    label: "累積請求額",
                    value: (
                      <span className="font-mono tabular-nums">
                        {formatYen(summary.invoicedTotal)}
                      </span>
                    ),
                  },
                  {
                    label: "累積入金額",
                    value: (
                      <span className="font-mono tabular-nums text-[var(--color-cyan-700)]">
                        {formatYen(summary.paidTotal)}
                      </span>
                    ),
                  },
                  {
                    label: "未入金額",
                    value: (
                      <span
                        className={cn(
                          "font-mono tabular-nums",
                          summary.unpaid > 0
                            ? "font-semibold text-red-600"
                            : "text-[var(--color-ink-700)]",
                        )}
                      >
                        {formatYen(summary.unpaid)}
                      </span>
                    ),
                  },
                ]}
              />
            </DetailSection>

            <DetailSection title="メタ情報">
              <DetailMetaList
                items={[
                  { label: "登録日時", value: fmtDateTime(customer.createdAt) },
                  { label: "最終更新", value: fmtDateTime(customer.updatedAt) },
                ]}
              />
            </DetailSection>
          </div>
        </div>

        <DetailSection title="関連レコード">
          <Tabs defaultValue="deals">
            <TabsList
              variant="line"
              className="h-auto w-full gap-0 overflow-x-auto border-b border-[var(--color-line)] bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] sm:w-fit sm:gap-1 [&::-webkit-scrollbar]:hidden"
            >
              <RelatedTab
                value="deals"
                icon={<Briefcase className="h-4 w-4" />}
                label="関連案件"
                count={customerDeals.length}
              />
              <RelatedTab
                value="quotes"
                icon={<FileText className="h-4 w-4" />}
                label="見積"
                count={customerQuotes.length}
              />
              <RelatedTab
                value="invoices"
                icon={<Receipt className="h-4 w-4" />}
                label="請求"
                count={customerInvoices.length}
              />
            </TabsList>

            <TabsContent value="deals" className="mt-4">
              <RelatedList empty="関連する案件はありません。">
                {customerDeals.map((deal) => (
                  <RelatedRow
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    primary={deal.title}
                    secondary={`確度 ${deal.probability}% ・ クローズ予定 ${fmtDate(deal.expectedCloseDate)}`}
                    trailing={formatYen(deal.amount)}
                    badge={<DealStageBadge stage={deal.stage} />}
                  />
                ))}
              </RelatedList>
            </TabsContent>

            <TabsContent value="quotes" className="mt-4">
              <RelatedList empty="見積はありません。">
                {customerQuotes.map((q) => (
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
            </TabsContent>

            <TabsContent value="invoices" className="mt-4">
              <RelatedList empty="請求はありません。">
                {customerInvoices.map((inv) => (
                  <RelatedRow
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    primary={inv.title || "（無題）"}
                    secondary={`${inv.number} ・ 期限 ${fmtDate(inv.dueDate)}`}
                    trailing={formatYen(inv.total)}
                    badge={<InvoiceStatusBadge status={inv.status} />}
                  />
                ))}
              </RelatedList>
            </TabsContent>
          </Tabs>
        </DetailSection>
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

function RelatedTab({
  value,
  icon,
  label,
  count,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "group/tab relative shrink-0 gap-2 rounded-none border-0 px-4 py-2.5 text-sm font-medium",
        "text-[var(--color-ink-500)] transition-colors",
        "hover:text-[var(--color-ink-950)]",
        "data-active:text-[var(--color-accent-700)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)] focus-visible:ring-offset-2",
        "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-[var(--color-accent-600)] after:opacity-0 after:transition-opacity",
        "data-active:after:opacity-100",
      )}
    >
      <span className="text-[var(--color-ink-400)] transition-colors group-data-active/tab:text-[var(--color-accent-600)]">
        {icon}
      </span>
      <span>{label}</span>
      <span
        className={cn(
          "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums leading-none",
          "bg-[var(--color-bg-soft)] text-[var(--color-ink-600)] transition-colors",
          "group-data-active/tab:bg-[var(--color-accent-100)] group-data-active/tab:text-[var(--color-accent-700)]",
        )}
      >
        {count}
      </span>
    </TabsTrigger>
  );
}
