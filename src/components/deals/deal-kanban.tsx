"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Deal, DealStage } from "@/lib/types/deal";
import {
  DEAL_STAGE_LABELS,
  PIPELINE_STAGES,
} from "@/lib/types/deal";
import type { Customer } from "@/lib/types/customer";
import { useDealsStore } from "@/lib/store/deals";
import { dealsByStage } from "@/lib/utils/aggregations";
import { formatYen } from "@/lib/utils/currency";
import { DealCard } from "./deal-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LostReasonDialog } from "./lost-reason-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

type DealKanbanProps = {
  deals: Deal[];
  customers: Customer[];
};

// Stages displayed as kanban lanes (lost is excluded — handled elsewhere)
const KANBAN_STAGES: DealStage[] = PIPELINE_STAGES;

// Extra drop targets for terminal transitions: drag onto these zones.
const TERMINAL_TARGETS: DealStage[] = ["lost"];

function Lane({
  stage,
  deals,
  customers,
}: {
  stage: DealStage;
  deals: Deal[];
  customers: Customer[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `lane-${stage}` });
  const total = deals.reduce((sum, d) => sum + d.amount, 0);
  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] flex-col gap-2 rounded-xl bg-[var(--color-bg-soft)] p-3 transition-colors",
        isOver && "ring-2 ring-[var(--color-accent-400)]",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line)] pb-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--color-ink-950)]">
            {DEAL_STAGE_LABELS[stage]}
          </p>
          <span className="rounded-full bg-card px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-ink-500)]">
            {deals.length}
          </span>
        </div>
        <span className="text-xs font-medium text-[var(--color-ink-700)]">
          {formatYen(total)}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {deals.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-[var(--color-ink-400)]">
            ここにドラッグ
          </p>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              customer={customerMap.get(deal.customerId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TerminalDropZone({
  stage,
  count,
}: {
  stage: DealStage;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `lane-${stage}` });
  const tone =
    stage === "lost"
      ? "border-red-300 text-red-700 hover:bg-red-50"
      : "border-[var(--color-cyan-200)] text-[var(--color-cyan-700)] hover:bg-[var(--color-cyan-50)]";
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-card text-xs font-medium transition-colors",
        tone,
        isOver && "bg-red-50",
      )}
    >
      <span>{DEAL_STAGE_LABELS[stage]}（{count}件）にドロップ</span>
    </div>
  );
}

export function DealKanban({ deals, customers }: DealKanbanProps) {
  const changeStage = useDealsStore((s) => s.changeStage);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );
  const [pendingWon, setPendingWon] = useState<string | null>(null);
  const [pendingLost, setPendingLost] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const grouped = useMemo(() => dealsByStage(deals), [deals]);

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const dealId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith("lane-")) return;
    const targetStage = overId.slice("lane-".length) as DealStage;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    if (deal.stage === targetStage) return;

    if (targetStage === "won") {
      setPendingWon(dealId);
      return;
    }
    if (targetStage === "lost") {
      setPendingLost(dealId);
      return;
    }
    changeStage(dealId, targetStage);
  };

  const lostCount = grouped.lost.length;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {deals.length === 0 ? (
        <EmptyState
          title="案件がまだありません"
          description="「+ 新規案件」から最初の案件を登録してください"
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {KANBAN_STAGES.map((stage) => (
              <Lane
                key={stage}
                stage={stage}
                deals={grouped[stage]}
                customers={customers}
              />
            ))}
          </div>
          {activeId ? (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {TERMINAL_TARGETS.map((stage) => (
                <TerminalDropZone
                  key={stage}
                  stage={stage}
                  count={stage === "lost" ? lostCount : 0}
                />
              ))}
            </div>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={pendingWon !== null}
        onOpenChange={(o) => {
          if (!o) setPendingWon(null);
        }}
        title="受注確定にしますか？"
        description="この案件を「Won（受注）」として確定します。クローズ日が今日になります。"
        confirmLabel="確定する"
        onConfirm={() => {
          if (pendingWon) changeStage(pendingWon, "won");
          setPendingWon(null);
        }}
      />

      <LostReasonDialog
        key={pendingLost ?? "closed"}
        open={pendingLost !== null}
        onOpenChange={(o) => {
          if (!o) setPendingLost(null);
        }}
        onConfirm={(reason) => {
          if (pendingLost) changeStage(pendingLost, "lost", reason);
          setPendingLost(null);
        }}
      />
    </DndContext>
  );
}
