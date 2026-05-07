"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { InvoiceEditor } from "@/components/invoices/invoice-editor";
import { useQuotesStore } from "@/lib/store/quotes";
import { newId } from "@/lib/utils/id";

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get("quoteId") ?? undefined;
  const dealId = searchParams.get("dealId") ?? undefined;

  const quotes = useQuotesStore((s) => s.quotes);

  const initialValues = useMemo(() => {
    const linkedQuote = quoteId
      ? quotes.find((q) => q.id === quoteId)
      : undefined;
    if (linkedQuote) {
      return {
        customerId: linkedQuote.customerId,
        quoteId: linkedQuote.id,
        dealId: linkedQuote.dealId ?? dealId,
        title: linkedQuote.title,
        items: linkedQuote.items.map((item) => ({
          ...item,
          id: newId("inv-item"),
        })),
      };
    }
    return {
      dealId,
    };
  }, [quoteId, dealId, quotes]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/invoices"
          className="inline-flex w-fit items-center gap-1 text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-950)]"
        >
          <ArrowLeft className="h-3 w-3" />
          請求一覧
        </Link>
        <header>
          <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
            新規請求
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">
            {quoteId
              ? "見積から複製して作成しています。"
              : "新しい請求書を作成します。"}
          </p>
        </header>

        <InvoiceEditor initialValues={initialValues} />
      </div>
    </AppShell>
  );
}
