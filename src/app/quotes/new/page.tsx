"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
        <div className="flex items-center gap-3">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={<Link href="/quotes" />}
          >
            <ArrowLeft className="h-4 w-4" />
            一覧へ
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
              新規見積
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">
              基本情報・明細を入力して保存してください
            </p>
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
