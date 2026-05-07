"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDealsStore } from "@/lib/store/deals";
import { useCustomersStore } from "@/lib/store/customers";
import { useMounted } from "@/hooks/use-mounted";
import { pipelineTotal } from "@/lib/utils/aggregations";
import { formatYen } from "@/lib/utils/currency";
import { DealKanban } from "@/components/deals/deal-kanban";
import { DealList } from "@/components/deals/deal-list";
import { DealSheet } from "@/components/deals/deal-sheet";

export default function DealsPage() {
  const mounted = useMounted();
  const deals = useDealsStore((s) => s.deals);
  const customers = useCustomersStore((s) => s.customers);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const total = pipelineTotal(deals);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-ink-950)]">
              案件パイプライン
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">
              アクティブパイプライン総額{" "}
              <span className="font-semibold text-[var(--color-ink-950)]">
                {formatYen(total)}
              </span>{" "}
              ・ {deals.length} 件
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setSheetOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              新規案件
            </Button>
          </div>
        </div>

        {!mounted ? (
          <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
        ) : (
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "kanban" | "list")}
          >
            <TabsList>
              <TabsTrigger value="kanban">カンバン</TabsTrigger>
              <TabsTrigger value="list">リスト</TabsTrigger>
            </TabsList>
            <TabsContent value="kanban" className="mt-4">
              <DealKanban deals={deals} customers={customers} />
            </TabsContent>
            <TabsContent value="list" className="mt-4">
              <DealList deals={deals} customers={customers} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <DealSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </AppShell>
  );
}
