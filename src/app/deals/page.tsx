"use client";

import { useId, useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/shared/segmented-control";
import { useDealsStore } from "@/lib/store/deals";
import { useCustomersStore } from "@/lib/store/customers";
import { useMounted } from "@/hooks/use-mounted";
import { pipelineTotal } from "@/lib/utils/aggregations";
import { formatYen } from "@/lib/utils/currency";
import { DealKanban } from "@/components/deals/deal-kanban";
import { DealList } from "@/components/deals/deal-list";
import { DealSheet } from "@/components/deals/deal-sheet";

type DealView = "kanban" | "list";

const VIEW_OPTIONS: SegmentedOption<DealView>[] = [
  { value: "kanban", label: "カンバン", icon: <LayoutGrid /> },
  { value: "list", label: "リスト", icon: <List /> },
];

export default function DealsPage() {
  const mounted = useMounted();
  const deals = useDealsStore((s) => s.deals);
  const customers = useCustomersStore((s) => s.customers);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [view, setView] = useState<DealView>("kanban");
  const groupId = useId();

  const total = pipelineTotal(deals);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
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
            <Button
              onClick={() => setSheetOpen(true)}
              className="w-full gap-1.5 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              新規案件
            </Button>
          </div>
        </div>

        {!mounted ? (
          <p className="text-sm text-[var(--color-ink-500)]">読み込み中...</p>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-start">
              <SegmentedControl<DealView>
                options={VIEW_OPTIONS}
                value={view}
                onChange={setView}
                ariaLabel="表示切替"
                groupId={groupId}
              />
            </div>
            <div
              role="tabpanel"
              id={`${groupId}-panel-${view}`}
              aria-labelledby={`${groupId}-tab-${view}`}
            >
              {view === "kanban" ? (
                <DealKanban deals={deals} customers={customers} />
              ) : (
                <DealList deals={deals} customers={customers} />
              )}
            </div>
          </div>
        )}
      </div>

      <DealSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </AppShell>
  );
}
