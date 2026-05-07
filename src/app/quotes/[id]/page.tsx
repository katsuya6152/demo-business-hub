"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { MoreVertical, Printer, Receipt, Save } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  DetailBackLink,
  DetailHeader,
} from "@/components/shared/detail-layout";
import { QuoteStatusBadge } from "@/components/shared/status-badge";
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

  const quotes = useQuotesStore((s) => s.quotes);
  const customers = useCustomersStore((s) => s.customers);
  const company = useSettingsStore((s) => s.settings.company);

  const quote = useMemo(() => quotes.find((q) => q.id === id), [quotes, id]);
  const customer = useMemo(
    () =>
      quote ? customers.find((c) => c.id === quote.customerId) : undefined,
    [customers, quote],
  );

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) {
    return (
      <AppShell>
        <div className="space-y-4">
          <DetailBackLink href="/quotes" label="見積一覧へ" />
          <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
        </div>
      </AppShell>
    );
  }

  if (!quote) {
    return (
      <AppShell>
        <div className="space-y-4">
          <DetailBackLink href="/quotes" label="見積一覧へ" />
          <EmptyState
            title="見積が見つかりません"
            description="削除されたか、URL が誤っている可能性があります。"
            action={
              <Link
                href="/quotes"
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

  return (
    <>
      <AppShell>
        <div className="space-y-6 screen-only">
          <div className="sticky top-14 z-10 -mx-4 border-b border-[var(--color-line)] bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DetailBackLink href="/quotes" label="見積一覧へ" />
              <div className="flex items-center gap-2">
                {/* Desktop: full actions */}
                <Link
                  href={`/invoices/new?quoteId=${quote.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "hidden md:inline-flex",
                  )}
                >
                  <Receipt className="h-4 w-4" />
                  請求書を作成
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="hidden md:inline-flex"
                >
                  <Printer className="h-4 w-4" />
                  印刷
                </Button>
                <Button type="submit" form="quote-form" size="sm">
                  <Save className="h-4 w-4" />
                  保存
                </Button>
                {/* Mobile: overflow menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="その他の操作"
                        className="md:hidden"
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

          <DetailHeader
            eyebrow={quote.number}
            title={quote.title || "（無題）"}
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
            badges={<QuoteStatusBadge status={quote.status} />}
          />

          <QuoteEditor quote={quote} />
        </div>
      </AppShell>
      <QuotePrint quote={quote} customer={customer} company={company} />
    </>
  );
}
