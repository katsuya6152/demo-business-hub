"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MoreVertical,
  Printer,
  Receipt,
  Save,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { useMounted } from "@/hooks/use-mounted";
import { useQuotesStore } from "@/lib/store/quotes";
import { useCustomersStore } from "@/lib/store/customers";
import { useSettingsStore } from "@/lib/store/settings";

import { QuoteEditor } from "@/components/quotes/quote-editor";
import { QuotePrint } from "@/components/quotes/quote-print";

type Params = { id: string };

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = use(params);
  const mounted = useMounted();
  const quote = useQuotesStore((s) => s.quotes.find((q) => q.id === id));
  const customer = useCustomersStore((s) =>
    quote ? s.customers.find((c) => c.id === quote.customerId) : undefined,
  );
  const company = useSettingsStore((s) => s.settings.company);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) {
    return (
      <AppShell>
        <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
      </AppShell>
    );
  }

  if (!quote) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={<Link href="/quotes" />}
          >
            <ArrowLeft className="h-4 w-4" />
            一覧へ
          </Button>
          <EmptyState
            title="見積が見つかりません"
            description="削除されたか、URL が誤っている可能性があります。"
            action={
              <Button nativeButton={false} render={<Link href="/quotes" />}>
                一覧に戻る
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <AppShell>
        <div className="space-y-6 screen-only">
          <div className="sticky top-0 z-10 -mx-4 -mt-6 border-b border-[var(--color-line)] bg-background/90 px-4 py-3 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  render={<Link href="/quotes" />}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">一覧へ</span>
                </Button>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold text-[var(--color-ink-950)] md:text-2xl">
                    {quote.title || "（無題）"}
                  </h1>
                  <p className="mt-0.5 truncate font-mono text-xs text-[var(--color-ink-500)]">
                    {quote.number}
                  </p>
                </div>
              </div>

              {/* Desktop: full action set */}
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                  render={<Link href={`/invoices/new?quoteId=${quote.id}`} />}
                >
                  <Receipt className="h-4 w-4" />
                  請求書を作成
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  印刷
                </Button>
                <Button type="submit" form="quote-form" size="sm">
                  <Save className="h-4 w-4" />
                  保存
                </Button>
              </div>

              {/* Mobile: save + overflow menu */}
              <div className="flex items-center gap-2 md:hidden">
                <Button type="submit" form="quote-form" size="sm">
                  <Save className="h-4 w-4" />
                  保存
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        nativeButton={false}
                        variant="outline"
                        size="icon-sm"
                        aria-label="その他の操作"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                      印刷
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={
                        <Link href={`/invoices/new?quoteId=${quote.id}`} />
                      }
                    >
                      <Receipt className="h-4 w-4" />
                      請求書を作成
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <QuoteEditor quote={quote} />
        </div>
      </AppShell>
      <QuotePrint quote={quote} customer={customer} company={company} />
    </>
  );
}
