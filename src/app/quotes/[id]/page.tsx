"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { FileDown, Printer, Receipt } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { buildPdfFilename, downloadBlob } from "@/lib/pdf/download";

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

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!quote) return;
    setDownloadingPdf(true);
    try {
      const [{ pdf }, { QuotePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/quote-pdf"),
      ]);
      const blob = await pdf(
        <QuotePdf quote={quote} customer={customer} company={company} />,
      ).toBlob();
      downloadBlob(
        blob,
        buildPdfFilename("見積", quote.number, customer?.name),
      );
      toast.success("PDF をダウンロードしました");
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("PDF の生成に失敗しました");
    } finally {
      setDownloadingPdf(false);
    }
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
          <DetailBackLink href="/quotes" label="見積一覧へ" />

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
            actions={
              <>
                <Link
                  href={`/invoices/new?quoteId=${quote.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">請求書を作成</span>
                </Link>
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
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">印刷</span>
                </Button>
              </>
            }
          />

          <QuoteEditor quote={quote} />
        </div>
      </AppShell>
      <QuotePrint quote={quote} customer={customer} company={company} />
    </>
  );
}
