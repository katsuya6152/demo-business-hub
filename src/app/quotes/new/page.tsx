"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";
import { QuoteEditor } from "@/components/quotes/quote-editor";

function NewQuoteContent() {
  const mounted = useMounted();
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId") ?? undefined;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="sticky top-0 z-10 -mx-4 -mt-6 border-b border-[var(--color-line)] bg-background/90 px-4 py-3 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
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
                  新規見積
                </h1>
                <p className="mt-0.5 hidden text-xs text-[var(--color-ink-500)] sm:block">
                  基本情報・明細を入力して保存してください
                </p>
              </div>
            </div>
            <Button type="submit" form="quote-form" size="sm">
              <Save className="h-4 w-4" />
              作成
            </Button>
          </div>
        </div>

        {mounted ? (
          <QuoteEditor defaultDealId={dealId} />
        ) : (
          <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
        )}
      </div>
    </AppShell>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
        </AppShell>
      }
    >
      <NewQuoteContent />
    </Suspense>
  );
}
