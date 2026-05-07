"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";

import { useQuotesStore } from "@/lib/store/quotes";
import { useCustomersStore } from "@/lib/store/customers";
import { useMounted } from "@/hooks/use-mounted";
import {
  type QuoteStatus,
  QUOTE_STATUS_LABELS,
} from "@/lib/types/quote";

import { QuoteTable } from "@/components/quotes/quote-table";

const STATUS_VALUES: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
];

export default function QuotesPage() {
  const mounted = useMounted();
  const quotes = useQuotesStore((s) => s.quotes);
  const customers = useCustomersStore((s) => s.customers);
  const removeQuote = useQuotesStore((s) => s.remove);
  const duplicateQuote = useQuotesStore((s) => s.duplicate);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const customerById = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (statusFilter !== "all" && quote.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const customerName =
        customerById.get(quote.customerId)?.name ?? "";
      return (
        quote.number.toLowerCase().includes(q) ||
        quote.title.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q)
      );
    });
  }, [quotes, query, statusFilter, customerById]);

  const handleDuplicate = (id: string) => {
    const created = duplicateQuote(id);
    if (created) {
      toast.success(`見積 ${created.number} を複製しました`);
    }
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    removeQuote(pendingDeleteId);
    toast.success("見積を削除しました");
    setPendingDeleteId(null);
  };

  const pendingTarget =
    pendingDeleteId !== null
      ? quotes.find((q) => q.id === pendingDeleteId)
      : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
              見積一覧
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">
              {mounted ? `${filtered.length} 件` : "—"}
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/quotes/new" />}>
            <Plus className="h-4 w-4" />
            新規見積
          </Button>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="番号・件名・顧客名で検索"
              aria-label="見積検索"
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter((v as QuoteStatus | "all" | null) ?? "all")
            }
          >
            <SelectTrigger className="w-full bg-card md:w-48">
              <SelectValue>
                {statusFilter === "all"
                  ? "すべての状態"
                  : QUOTE_STATUS_LABELS[statusFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての状態</SelectItem>
              {STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {QUOTE_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!mounted ? (
          <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title={
              quotes.length === 0
                ? "見積がまだありません"
                : "条件に合う見積が見つかりません"
            }
            description={
              quotes.length === 0
                ? "「+ 新規見積」から最初の見積を作成しましょう"
                : "検索条件・ステータスフィルタを見直してください"
            }
            action={
              quotes.length === 0 ? (
                <Button nativeButton={false} render={<Link href="/quotes/new" />}>
                  <Plus className="h-4 w-4" />
                  新規見積
                </Button>
              ) : null
            }
          />
        ) : (
          <QuoteTable
            quotes={filtered}
            customers={customers}
            onDuplicate={handleDuplicate}
            onRequestDelete={setPendingDeleteId}
          />
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="見積を削除しますか？"
        description={
          pendingTarget ? (
            <>
              <strong className="block">{pendingTarget.number}</strong>
              <span>{pendingTarget.title}</span>
              <span className="block mt-1">この操作は元に戻せません。</span>
            </>
          ) : (
            "この操作は元に戻せません。"
          )
        }
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}
